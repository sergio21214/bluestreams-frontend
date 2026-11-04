import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';

import {
  contentTypeForFile,
  ensureSubtitle,
  getVodSession,
  resolveSessionFile
} from '@/lib/server/vod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ sessionId: string; file: string }>;
  }
): Promise<Response> {
  const { sessionId, file } = await context.params;

  const session = getVodSession(sessionId);

  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  if (file.startsWith('sub_') && file.endsWith('.vtt')) {
    const index = Number(file.slice(4, -4));

    if (Number.isFinite(index)) {
      try {
        await ensureSubtitle(session, index);
      } catch (error) {
        console.error('Subtitle extraction failed', error);

        return new Response('Subtitle not available', {
          status: 404
        });
      }
    }
  }

  const target = resolveSessionFile(session, file);

  if (!target) {
    return new Response('Invalid file', { status: 400 });
  }

  try {
    const stat = await fs.stat(target);

    if (!stat.isFile()) {
      return new Response('Not found', { status: 404 });
    }

    const stream = Readable.toWeb(
      createReadStream(target)
    ) as unknown as ReadableStream;

    return new Response(stream, {
      headers: {
        'Content-Type': contentTypeForFile(file),
        'Content-Length': String(stat.size),
        'Cache-Control': file.endsWith('.m3u8')
          ? 'no-cache'
          : 'public, max-age=3600'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
