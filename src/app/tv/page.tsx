'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

import Navbar from '@/components/Navbar';

export default function TVPage() {

    const API_URL =
        process.env.NEXT_PUBLIC_API_URL;

    const videoRef =
        useRef<HTMLVideoElement>(null);

    const [providers, setProviders] =
        useState<any[]>([]);

    const [provider, setProvider] =
        useState<number>(0);

    const [groups, setGroups] =
        useState<string[]>([]);

    const [groupFilter, setGroupFilter] =
        useState<string>('');

    const [groupsLoading, setGroupsLoading] =
        useState(false);

    const [channels, setChannels] =
        useState<any[]>([]);

    const [selected, setSelected] =
        useState<any>(null);

    const [search, setSearch] =
        useState('');

    const [loading, setLoading] =
        useState(false);

    const getLogo = (logo?: string) => {

        if (!logo)
            return '/tv-placeholder.png';

        if (
            logo.startsWith('http://') ||
            logo.startsWith('https://')
        )
            return logo;

        return '/tv-placeholder.png';

    };

    // Direct media files (no HLS manifest) need Shaka Player instead of hls.js
    const isDirectFile = (url?: string) => {

        if (!url)
            return false;

        return /\.(mkv|mp4|avi)(\?.*)?$/i.test(url.trim());

    };

    // Search only narrows within the currently loaded (single-group) channel
    // list, so this stays cheap even for huge providers.
    const filtered = search.trim() === ''
        ? channels
        : channels.filter(channel => {

            const name =
                (channel.name ?? "").trim().toLowerCase();

            return name.includes(search.trim().toLowerCase());

        });

    /* Load IPTV providers */

    useEffect(() => {

        fetch(`${API_URL}/iptv/providers`)
            .then(r => r.json())
            .then(data => {

                setProviders(data);

                if (data.length > 0) {

                    setProvider(data[0].id);

                }

            });

    }, []);

    /* Load groups for the selected provider, preselect the first one.
       This is a cheap "distinct group names" query — it never touches the
       95k-row channel table directly. */

    useEffect(() => {

        if (!provider)
            return;

        setGroupsLoading(true);
        setGroups([]);
        setGroupFilter('');
        setChannels([]);
        setSelected(null);

        fetch(`${API_URL}/iptv/${provider}/groups`)
            .then(r => r.json())
            .then((data: string[]) => {

                setGroups(data);

                if (data.length > 0) {

                    setGroupFilter(data[0]);

                }

            })
            .finally(() => setGroupsLoading(false));

    }, [provider]);

    /* Load channels for provider + selected group only.
       Never fetches the full 95k-row list unless the user explicitly
       picks "All". */

    useEffect(() => {

        if (!provider || !groupFilter)
            return;

        setLoading(true);

        fetch(`${API_URL}/iptv/${provider}?group=${encodeURIComponent(groupFilter)}`)
            .then(r => r.json())
            .then(data => {

                const proxied = data.map((channel: any) => ({

                    ...channel,

                    streamUrl:
                        `${API_URL}/iptv/proxy/${channel.id}`

                }));

                setChannels(proxied);

                if (proxied.length > 0) {

                    setSelected(proxied[0]);

                } else {

                    setSelected(null);

                }

            })
            .finally(() => setLoading(false));

    }, [provider, groupFilter]);

    
    /* PLAYER */
    useEffect(() => {

        if (!selected)
            return;

        const video = videoRef.current;

        if (video == null)
            return;

        const videoElement: HTMLVideoElement = video;

        let hls: Hls | null = null;
        let cancelled = false;

        async function startPlayer() {

            try {

                videoElement.pause();
                videoElement.removeAttribute("src");
                videoElement.load();

                // Tell Quarkus to start FFmpeg
                await fetch(
                    `${API_URL}/iptv/hls/start/${selected.id}`
                );

                // Give FFmpeg a few seconds to create the playlist
                await new Promise(resolve =>
                    setTimeout(resolve, 3000)
                );

                if (cancelled)
                    return;

                const playlistUrl =
                    `${API_URL}/iptv/hls/${selected.id}/playlist.m3u8`;

                console.log("Loading:", playlistUrl);

                if (Hls.isSupported()) {

                    hls = new Hls({

                        enableWorker: true,

                        lowLatencyMode: true

                    });

                    hls.loadSource(playlistUrl);

                    hls.attachMedia(videoElement);

                    hls.on(
                        Hls.Events.MANIFEST_PARSED,
                        () => {

                            console.log("Manifest loaded");

                            videoElement.play().catch(console.error);

                        }
                    );

                    hls.on(Hls.Events.ERROR, (_, data) => {

                        console.log("HLS ERROR");

                        console.log("type:", data.type);

                        console.log("details:", data.details);

                        console.log("fatal:", data.fatal);

                        console.log(data);

                    });

                }
                else if (
                    videoElement.canPlayType(
                        "application/vnd.apple.mpegurl"
                    )
                ) {

                    videoElement.src = playlistUrl;

                    videoElement.play().catch(console.error);

                }
                else {

                    console.error("HLS not supported");

                }

            }
            catch (e) {

                console.error(e);

            }

        }

        startPlayer();

        return () => {

            cancelled = true;

            if (hls) {

                hls.destroy();

            }

            videoElement.pause();

            videoElement.removeAttribute("src");

            videoElement.load();

        };

    }, [selected, API_URL]);

    return (

        <main className="bg-black text-white min-h-screen">

            <Navbar />

            <div className="pt-24 px-8">

                <div className="flex justify-between items-center mb-8">

                    <h1 className="text-5xl font-bold">
                        Live TV
                    </h1>

                    <div className="flex gap-3">

                        <select
                            value={provider}
                            onChange={(e) => setProvider(Number(e.target.value))}
                            className="bg-zinc-900 rounded-xl px-4 py-3"
                        >
                            {providers.map((p) => (
                                <option
                                    key={p.id}
                                    value={p.id}
                                >
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            disabled={groupsLoading || groups.length === 0}
                            className="bg-zinc-900 rounded-xl px-4 py-3"
                        >
                            {groups.map(group => (
                                <option
                                    key={group}
                                    value={group}
                                >
                                    {group}
                                </option>
                            ))}
                        </select>

                    </div>

                </div>

                <div className="flex gap-8">

                    {/* LEFT */}

                    <div className="w-[420px]">

                        <input

                            value={search}

                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }

                            placeholder="Search channel in this group..."

                            className="
                                w-full
                                bg-zinc-900
                                rounded-xl
                                p-3
                                mb-5
                            "

                        />

                        <p className="text-zinc-400 mb-2">
                            Showing {filtered.length} channels in "{groupFilter || '...'}"
                        </p>

                        <div className="h-[78vh] overflow-y-auto">
                             {loading || groupsLoading ? (

                                <div className="flex justify-center items-center h-full">

                                    <div
                                        className="
                                            w-10
                                            h-10
                                            border-4
                                            border-zinc-600
                                            border-t-blue-500
                                            rounded-full
                                            animate-spin
                                        "
                                    />

                                </div>

                                ) : (
                                    <div className="space-y-2">
                                        {filtered.map(channel => (

                                            <button

                                                key={`${channel.id}-${channel.name}`}

                                                onClick={() =>
                                                    setSelected(channel)
                                                }

                                                className={`
                                                    w-full
                                                    flex
                                                    items-center
                                                    gap-3
                                                    p-2
                                                    rounded-xl
                                                    transition
                                                    ${
                                                        selected?.streamUrl === channel.streamUrl
                                                        ? 'bg-blue-600'
                                                        : 'bg-zinc-900 hover:bg-zinc-800'
                                                    }
                                                `}

                                            >

                                                <img

                                                    src={
                                                        getLogo(channel.logo)
                                                    }

                                                    className="
                                                        w-10
                                                        h-10
                                                        object-contain
                                                        rounded
                                                        bg-white
                                                        p-1
                                                    "

                                                    onError={(e) => {
                                                        const img = e.currentTarget;

                                                        // prevent infinite loop
                                                        img.onerror = null;

                                                        img.src = "/tv-placeholder.png";
                                                    }}

                                                />

                                                <div className="text-left flex-1">

                                                    <div className="font-semibold">

                                                        {channel.name}

                                                    </div>

                                                    <div className="text-xs text-zinc-400">

                                                        {channel.groupName}

                                                    </div>

                                                </div>

                                            </button>

                                        ))}
                                    </div>
                                    )}
                        </div>

                    </div>

                    {/* PLAYER */}

                    <div className="flex-1">

                        {selected && (

                            <>

                                <h2 className="text-3xl font-bold">

                                    {selected.name}

                                </h2>

                                <p className="text-zinc-400 mb-5">

                                    {selected.groupName}

                                </p>

                                <video
                                    ref={videoRef}
                                    controls
                                    autoPlay
                                    playsInline
                                    muted={false}
                                    className="
                                        w-full
                                        rounded-2xl
                                        bg-black
                                    "
                                />

                            </>

                        )}

                    </div>

                </div>

            </div>

        </main>

    );

}