'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAudioPlayer } from '@/app/context/AudioPlayerContext';

export default function RepeatPage() {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const { playTrack } = useAudioPlayer();

    const [tracks, setTracks] = useState<any[]>([]);

    useEffect(() => {

        const token = localStorage.getItem('token');
        const profileId = localStorage.getItem('profileId');

        console.log('tracks', tracks);
        
        fetch(`${API_URL}/music/history/repeat`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Profile-Id': profileId!
            }
        })
        .then(r => r.json())
        .then(data => {

            const normalized = data.map((track: any) => ({
                ...track,
                id: track.mediaId
            }));

            console.log(normalized);

            setTracks(normalized);

        });

    }, []);

    return (

        <main className="bg-black text-white min-h-screen">

            <Navbar />

            <div className="pt-28 px-8">

                <div className="flex items-center justify-between mb-8">

                    <div>

                        <h1 className="text-5xl font-bold">
                            On Repeat
                        </h1>

                        <p className="text-zinc-400 mt-2">
                            {tracks.length} songs
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            tracks.length &&
                            playTrack(tracks[0], tracks)
                        }
                        className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-semibold"
                    >
                        ▶ Play Playlist
                    </button>

                </div>

                <div className="space-y-2">

                    {tracks.map((track, index) => (

                        <button
                            key={track.mediaId}
                            onClick={() => {
                                console.log("CLICK");
                                console.log(track);

                                playTrack(track, tracks);
                            }}
                            className="w-full flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl p-3 transition"
                        >

                            <div className="w-8 text-zinc-500">
                                {index + 1}
                            </div>

                            <img
                                src={track.poster}
                                className="w-14 h-14 rounded-lg object-cover"
                            />

                            <div className="flex-1 text-left">

                                <div className="font-semibold">
                                    {track.title}
                                </div>

                                <div className="text-sm text-zinc-400">
                                    {track.artist}
                                </div>

                            </div>

                            <div className="text-sm text-zinc-500">
                                {track.playCount} plays
                            </div>

                        </button>

                    ))}

                </div>

            </div>

        </main>

    );
}