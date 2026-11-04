import { execFile, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

import { assertPublicUrl, USER_AGENT } from './network';

const execFileAsync = promisify(execFile);

const BASE_DIR = path.join(os.tmpdir(), 'bluestreams-vod');
const IDLE_MS = 15 * 60 * 1000;

const TEXT_SUBTITLE_CODECS = new Set([
  'subrip',
  'srt',
  'ass',
  'ssa',
  'mov_text',
  'webvtt',
  'text'
]);

type RawStream = {
  index: number;
  codec_type?: string;
  codec_name?: string;
  tags?: {
    language?: string;
    title?: string;
  };
};

export type VodSubtitleTrack = {
  index: number;
  label: string;
  language: string;
  fileName: string;
  url: string;
};

type VodSession = {
  id: string;
  inputUrl: string;
  dir: string;
  process: ChildProcess | null;
  subtitles: VodSubtitleTrack[];
  subtitleProcesses: Map<number, Promise<string>>;
  createdAt: number;
  lastAccess: number;
};

type VodGlobal = {
  __bluestreamsVodSessions?: Map<string, VodSession>;
  __bluestreamsVodCleanup?: ReturnType<typeof setInterval>;
};

const globalStore = globalThis as unknown as VodGlobal;

const sessions =
  globalStore.__bluestreamsVodSessions ??
  new Map<string, VodSession>();

globalStore.__bluestreamsVodSessions = sessions;

if (!globalStore.__bluestreamsVodCleanup) {
  const timer = setInterval(() => {
    const now = Date.now();

    sessions.forEach((session) => {
      if (now - session.lastAccess < IDLE_MS) {
        return;
      }

      if (session.process) {
        session.process.kill('SIGKILL');
      }

      sessions.delete(session.id);
      void fs.rm(session.dir, { recursive: true, force: true });
    });
  }, 60_000);

  timer.unref?.();
  globalStore.__bluestreamsVodCleanup = timer;
}

function languageLabel(language?: string | null): string {
  if (!language) {
    return '';
  }

  try {
    const display = new Intl.DisplayNames(['en'], {
      type: 'language'
    }).of(language);

    if (display && display !== language) {
      return display;
    }
  } catch {
    // Fall through.
  }

  return language.toUpperCase();
}

async function probeStreams(inputUrl: string): Promise<RawStream[]> {
  const { stdout } = await execFileAsync(
    'ffprobe',
    [
      '-v',
      'error',
      '-user_agent',
      USER_AGENT,
      '-show_entries',
      'stream=index,codec_type,codec_name:stream_tags=language,title',
      '-of',
      'json',
      inputUrl
    ],
    {
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024
    }
  );

  const parsed = JSON.parse(stdout) as { streams?: RawStream[] };

  return parsed.streams ?? [];
}

export async function startVodSession(inputUrl: string): Promise<{
  id: string;
  master: string;
  subtitles: VodSubtitleTrack[];
}> {
  await assertPublicUrl(new URL(inputUrl));

  const streams = await probeStreams(inputUrl);

  const video = streams.find(
    (stream) =>
      stream.codec_type === 'video' &&
      !['mjpeg', 'png', 'bmp', 'gif'].includes(
        (stream.codec_name ?? '').toLowerCase()
      )
  );

  if (!video) {
    throw new Error('No playable video stream found');
  }

  const audios = streams.filter(
    (stream) => stream.codec_type === 'audio'
  );

  const subtitleStreams = streams.filter(
    (stream) =>
      stream.codec_type === 'subtitle' &&
      TEXT_SUBTITLE_CODECS.has(
        (stream.codec_name ?? '').toLowerCase()
      )
  );

  const id = crypto.randomUUID();
  const dir = path.join(BASE_DIR, id);

  await fs.mkdir(dir, { recursive: true });

  const container = path.join(dir, '%v.m3u8');
  const segmentPattern = path.join(dir, '%v_seg_%03d.ts');

  const isHevc = ['hevc', 'h265'].includes(
    (video.codec_name ?? '').toLowerCase()
  );

  const varStreamMap = ['v:0,agroup:aud,name:Video'];

  audios.forEach((audio, index) => {
    const language = (audio.tags?.language ?? 'und').replace(
      /[^A-Za-z0-9-]/g,
      ''
    ) || 'und';

    varStreamMap.push(
      `a:${index},agroup:aud,${
        index === 0 ? 'default:yes,' : ''
      }language:${language}`
    );
  });

  const args = [
    '-y',
    '-user_agent',
    USER_AGENT,
    '-i',
    inputUrl,
    '-map',
    `0:${video.index}`,
    ...audios.flatMap((audio) => ['-map', `0:${audio.index}`]),
    '-c:v',
    isHevc ? 'libx264' : 'copy',
    ...(isHevc ? ['-preset', 'veryfast', '-crf', '22'] : []),
    ...(audios.length > 0
      ? ['-c:a', 'aac', '-b:a', '160k']
      : []),
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_playlist_type',
    'event',
    '-hls_flags',
    'independent_segments',
    '-hls_segment_filename',
    segmentPattern,
    '-var_stream_map',
    varStreamMap.join(' '),
    '-master_pl_name',
    'master.m3u8',
    container
  ];

  let stderr = '';

  const child = spawn('ffmpeg', args, {
    stdio: ['ignore', 'ignore', 'pipe']
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();

    if (stderr.length > 20_000) {
      stderr = stderr.slice(-20_000);
    }
  });

  const session: VodSession = {
    id,
    inputUrl,
    dir,
    process: child,
    subtitles: subtitleStreams.map((stream, index) => {
      const language = stream.tags?.language ?? 'und';
      const title =
        stream.tags?.title ||
        languageLabel(language) ||
        `Subtitle ${index + 1}`;

      return {
        index: stream.index,
        label: title,
        language,
        fileName: `sub_${stream.index}.vtt`,
        url: `/api/xtream/vod/${id}/sub_${stream.index}.vtt`
      };
    }),
    subtitleProcesses: new Map(),
    createdAt: Date.now(),
    lastAccess: Date.now()
  };

  sessions.set(id, session);

  child.on('exit', () => {
    session.process = null;
  });

  const master = path.join(dir, 'master.m3u8');
  const deadline = Date.now() + 60_000;

  while (true) {
    if (await exists(master)) {
      break;
    }

    if (child.exitCode !== null) {
      sessions.delete(id);
      void fs.rm(dir, { recursive: true, force: true });

      throw new Error(
        `FFmpeg exited while preparing video${
          stderr ? `: ${stderr.slice(-400)}` : ''
        }`
      );
    }

    if (Date.now() > deadline) {
      child.kill('SIGKILL');
      sessions.delete(id);
      void fs.rm(dir, { recursive: true, force: true });

      throw new Error('Timed out while preparing video');
    }

    await sleep(200);
  }

  return {
    id,
    master: `/api/xtream/vod/${id}/master.m3u8`,
    subtitles: session.subtitles
  };
}

export function getVodSession(id: string): VodSession | null {
  const session = sessions.get(id);

  if (!session) {
    return null;
  }

  session.lastAccess = Date.now();

  return session;
}

export async function ensureSubtitle(
  session: VodSession,
  subtitleIndex: number
): Promise<string | null> {
  const subtitle = session.subtitles.find(
    (item) => item.index === subtitleIndex
  );

  if (!subtitle) {
    return null;
  }

  const target = path.join(session.dir, subtitle.fileName);

  if (await exists(target, 16)) {
    return target;
  }

  const pending = session.subtitleProcesses.get(subtitleIndex);

  if (pending) {
    return pending;
  }

  const extraction = new Promise<string>((resolve, reject) => {
    const child = spawn(
      'ffmpeg',
      [
        '-y',
        '-user_agent',
        USER_AGENT,
        '-i',
        session.inputUrl,
        '-map',
        `0:${subtitleIndex}`,
        '-c:s',
        'webvtt',
        target
      ],
      {
        stdio: 'ignore'
      }
    );

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(target);
      } else {
        reject(new Error(`Subtitle extraction failed (${code})`));
      }
    });
  });

  session.subtitleProcesses.set(subtitleIndex, extraction);

  try {
    return await extraction;
  } finally {
    session.subtitleProcesses.delete(subtitleIndex);
  }
}

export function resolveSessionFile(
  session: VodSession,
  fileName: string
): string | null {
  if (
    !fileName ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName.includes('..')
  ) {
    return null;
  }

  return path.join(session.dir, fileName);
}

export function contentTypeForFile(fileName: string): string {
  if (fileName.endsWith('.m3u8')) {
    return 'application/vnd.apple.mpegurl';
  }

  if (fileName.endsWith('.ts')) {
    return 'video/mp2t';
  }

  if (fileName.endsWith('.m4s') || fileName.endsWith('.mp4')) {
    return 'video/mp4';
  }

  if (fileName.endsWith('.vtt')) {
    return 'text/vtt; charset=utf-8';
  }

  return 'application/octet-stream';
}

async function exists(
  target: string,
  minSize = 1
): Promise<boolean> {
  try {
    const stat = await fs.stat(target);

    return stat.isFile() && stat.size >= minSize;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
