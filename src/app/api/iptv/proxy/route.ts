import dns from 'node:dns/promises';
import net from 'node:net';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_REDIRECTS = 5;

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);

  if (family === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (family === 6) {
    const lower = ip.toLowerCase();

    if (lower === '::' || lower === '::1') {
      return true;
    }

    if (
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe80')
    ) {
      return true;
    }

    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

    if (mapped) {
      return isPrivateIp(mapped[1]);
    }

    return false;
  }

  return true;
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');

  if (
    host === 'localhost' ||
    host === 'metadata.google.internal' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    throw new Error('Blocked host');
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error('Blocked address');
    }

    return;
  }

  const addresses = await dns.lookup(host, { all: true });

  if (addresses.length === 0) {
    throw new Error('Could not resolve host');
  }

  if (addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error('Blocked address');
  }
}

async function fetchUpstream(
  target: URL,
  request: Request
): Promise<{ response: Response; finalUrl: URL }> {
  const headers = new Headers();

  headers.set('User-Agent', USER_AGENT);
  headers.set('Accept', request.headers.get('accept') ?? '*/*');

  const range = request.headers.get('range');

  if (range) {
    headers.set('Range', range);
  }

  let current = target;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    await assertPublicUrl(current);

    const response = await fetch(current, {
      headers,
      redirect: 'manual',
      cache: 'no-store'
    });


    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');

      await response.text().catch(() => {});

      if (!location) {
        return { response, finalUrl: current };
      }

      current = new URL(location, current);
      continue;
    }

    return { response, finalUrl: current };
  }

  throw new Error('Too many redirects');
}

function rewritePlaylist(text: string, base: URL): string {
  const proxify = (uri: string): string => {
    try {
      const absolute = new URL(uri, base);

      if (
        absolute.protocol !== 'http:' &&
        absolute.protocol !== 'https:'
      ) {
        return uri;
      }

      return `/api/iptv/proxy?url=${encodeURIComponent(
        absolute.toString()
      )}`;
    } catch {
      return uri;
    }
  };

  return text
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) {
        return line;
      }

      if (line.startsWith('#')) {
        return line.replace(/URI="([^"]*)"/g, (_match, uri: string) => {
          return `URI="${proxify(uri)}"`;
        });
      }

      return proxify(line.trim());
    })
    .join('\n');
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawUrl = url.searchParams.get('url');

  if (!rawUrl) {
    return Response.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  let target: URL;

  try {
    target = new URL(rawUrl);
  } catch {
    return Response.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    const { response, finalUrl } = await fetchUpstream(target, request);

    if (!response.ok) {
      return Response.json(
        {
          error: `Upstream responded with ${response.status}`,
          upstreamStatus: response.status
        },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') ?? '';

    const looksLikePlaylist =
      /\.m3u8?$/i.test(finalUrl.pathname) ||
      /mpegurl|m3u/i.test(contentType);

    if (looksLikePlaylist) {
      const text = await response.text();

      const isHls = /#EXT-X-/i.test(text);

      const body = isHls
        ? rewritePlaylist(text, finalUrl)
        : text;

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': isHls
            ? 'application/vnd.apple.mpegurl'
            : 'audio/x-mpegurl',
          'Cache-Control': 'no-cache'
        }
      });
    }

    const headers = new Headers();

    for (const name of [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag'
    ]) {
      const value = response.headers.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    headers.set('Cache-Control', 'no-cache');

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('IPTV proxy failed', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not reach the provider'
      },
      { status: 502 }
    );
  }
}
