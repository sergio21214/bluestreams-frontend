'use client';

import Link from 'next/link';

import { Card, SectionTitle } from './ui';

export default function MusicSection() {
  return (
    <div className="space-y-6">

      <Card>
        <SectionTitle
          title="Music downloader"
          subtitle="Queue downloads from YouTube and YouTube Music, and watch their progress."
        />

        <div className="rounded-2xl border border-white/5 bg-black/20 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Download music
              </h3>
              <p className="mt-1 max-w-xl text-sm text-zinc-400">
                Paste a YouTube or YouTube Music URL, or a playlist link.
                Downloads run on the server and appear in your music library
                when complete.
              </p>
            </div>

            <Link
              href="/admin/music"
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-600
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-500
              "
            >
              Open downloader
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Library maintenance"
          subtitle="Keep your music metadata and artwork up to date."
        />

        <p className="text-sm text-zinc-400">
          Use <span className="text-white">Scan music</span> in the Queue or
          Overview tab to refresh the music library after adding files.
        </p>
      </Card>

    </div>
  );
}
