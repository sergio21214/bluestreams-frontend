import dns from 'node:dns/promises';
import net from 'node:net';

export const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function isPrivateIp(ip: string): boolean {
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

export async function assertPublicUrl(url: URL): Promise<void> {
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
