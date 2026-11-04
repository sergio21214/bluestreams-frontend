import { assertPublicUrl, USER_AGENT } from '@/lib/server/network';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_REDIRECTS = 5;

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
