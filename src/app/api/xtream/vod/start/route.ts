import { startVodSession } from '@/lib/server/vod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return Response.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    const session = await startVodSession(url);

    return Response.json(session);
  } catch (error) {
    console.error('Could not prepare VOD session', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not prepare video'
      },
      { status: 502 }
    );
  }
}
