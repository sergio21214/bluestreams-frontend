
'use client';

import { useEffect, useState } from 'react';

type DownloadJob = {
    id: number;
    url: string;
    status: string;
    title: string | null;
    artist: string | null;
    album: string | null;
    youtubeId: string | null;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    outputPath: string | null;
    thumbnailPath: string | null;
    errorMessage: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
};

export default function AdminMusicPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [url, setUrl] = useState('');
    const [jobs, setJobs] = useState<DownloadJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const getToken = () => {
        return localStorage.getItem('token');
    };

    const loadJobs = async () => {
        const token = getToken();

        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/music/download/jobs`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 401 || response.status === 403) {
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                throw new Error(
                    `Failed to load download jobs (${response.status})`
                );
            }

            const data = await response.json();
            setJobs(data);
        } catch (err) {
            console.error(err);
            setError('Could not load download jobs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    /*
     * Poll while there are active jobs.
     *
     * We don't need to constantly poll when everything is completed.
     */
    useEffect(() => {
        const hasActiveJobs = jobs.some(
            job =>
                job.status === 'QUEUED' ||
                job.status === 'DOWNLOADING' ||
                job.status === 'PROCESSING'
        );

        if (!hasActiveJobs) {
            return;
        }

        const interval = setInterval(() => {
            loadJobs();
        }, 2000);

        return () => clearInterval(interval);
    }, [jobs]);

    const downloadMusic = async () => {
        console.log(
            'DOWNLOAD MUSIC CALLED',
            new Date().toISOString()
        );
        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            setError('Please enter a YouTube or YouTube Music URL.');
            return;
        }

        const token = getToken();

        if (!token) {
            window.location.href = '/login';
            return;
        }

        setDownloading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(
                `${API_URL}/music/download`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: trimmedUrl
                    })
                }
            );

            if (response.status === 401 || response.status === 403) {
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                const text = await response.text();

                throw new Error(
                    text || `Download request failed (${response.status})`
                );
            }

            const data = await response.json();

            setUrl('');

            if (data?.playlist) {

                setMessage(
                    `Playlist queued: ${data.total} songs.`
                );

            } else {

                setMessage(
                    data?.jobs?.[0]?.title
                        ? `Download queued: ${data.jobs[0].title}`
                        : 'Download queued successfully.'
                );
            }

            await loadJobs();
        } catch (err: any) {
            console.error(err);

            setError(
                err?.message ||
                'Could not start the download.'
            );
        } finally {
            setDownloading(false);
        }
    };

    const formatDuration = (
        seconds: number | null
    ) => {
        if (seconds == null) {
            return '';
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds
            .toString()
            .padStart(2, '0')}`;
    };

    const formatDate = (
        value: string | null
    ) => {
        if (!value) {
            return '';
        }

        return new Date(value).toLocaleString();
    };

    const statusClass = (
        status: string
    ) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-900/40 text-green-400';

            case 'FAILED':
                return 'bg-red-900/40 text-red-400';

            case 'DOWNLOADING':
                return 'bg-blue-900/40 text-blue-400';

            case 'PROCESSING':
                return 'bg-purple-900/40 text-purple-400';

            case 'QUEUED':
                return 'bg-yellow-900/40 text-yellow-400';

            default:
                return 'bg-slate-800 text-slate-300';
        }
    };

    const statusLabel = (
        status: string
    ) => {
        switch (status) {
            case 'QUEUED':
                return 'Queued';

            case 'DOWNLOADING':
                return 'Downloading';

            case 'PROCESSING':
                return 'Processing';

            case 'COMPLETED':
                return 'Completed';

            case 'FAILED':
                return 'Failed';

            default:
                return status;
        }
    };

    return (
        <main className="
            min-h-screen
            bg-slate-950
            text-white
            p-10
        ">

            <div className="
                max-w-7xl
                mx-auto
            ">

                <div className="
                    flex
                    items-center
                    justify-between
                    mb-10
                ">
                    <div>
                        <h1 className="
                            text-5xl
                            font-bold
                            text-blue-400
                        ">
                            Music Downloader
                        </h1>

                        <p className="
                            text-slate-400
                            mt-2
                        ">
                            Download music from YouTube or YouTube Music
                        </p>
                    </div>

                    <button
                        onClick={loadJobs}
                        className="
                            bg-slate-800
                            hover:bg-slate-700
                            px-5
                            py-3
                            rounded-xl
                            transition
                        "
                    >
                        Refresh
                    </button>
                </div>

                {/* DOWNLOAD FORM */}

                <div className="
                    bg-slate-900
                    rounded-2xl
                    p-6
                    mb-10
                ">

                    <h2 className="
                        text-2xl
                        font-bold
                        text-blue-400
                        mb-5
                    ">
                        Add Music
                    </h2>

                    <div className="
                        flex
                        gap-3
                    ">

                        <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError('');
                                setMessage('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    downloadMusic();
                                }
                            }}
                            placeholder="
                                Paste a YouTube or YouTube Music URL...
                            "
                            className="
                                flex-1
                                bg-slate-950
                                border
                                border-slate-700
                                focus:border-blue-500
                                outline-none
                                rounded-xl
                                px-5
                                py-4
                                transition
                            "
                        />

                        <button
                            onClick={downloadMusic}
                            disabled={
                                downloading ||
                                !url.trim()
                            }
                            className="
                                bg-blue-600
                                hover:bg-blue-500
                                disabled:bg-slate-700
                                disabled:text-slate-500
                                px-7
                                py-4
                                rounded-xl
                                font-semibold
                                transition
                                min-w-[130px]
                            "
                        >
                            {downloading
                                ? 'Starting...'
                                : 'Download'}
                        </button>

                    </div>

                    {message && (
                        <p className="
                            text-green-400
                            mt-4
                        ">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p className="
                            text-red-400
                            mt-4
                            whitespace-pre-wrap
                        ">
                            {error}
                        </p>
                    )}

                </div>

                {/* DOWNLOADS */}

                <div className="
                    bg-slate-900
                    rounded-2xl
                    p-6
                ">

                    <div className="
                        flex
                        items-center
                        justify-between
                        mb-6
                    ">
                        <div>
                            <h2 className="
                                text-2xl
                                font-bold
                                text-blue-400
                            ">
                                Recent Downloads
                            </h2>

                            <p className="
                                text-slate-400
                                text-sm
                                mt-1
                            ">
                                {jobs.length} recent jobs
                            </p>
                        </div>
                    </div>

                    {loading ? (

                        <div className="
                            flex
                            justify-center
                            py-20
                        ">
                            <div className="
                                w-10
                                h-10
                                border-4
                                border-slate-700
                                border-t-blue-500
                                rounded-full
                                animate-spin
                            " />
                        </div>

                    ) : jobs.length === 0 ? (

                        <div className="
                            text-center
                            py-20
                            text-slate-500
                        ">
                            No downloads yet.
                        </div>

                    ) : (

                        <div className="
                            space-y-3
                        ">

                            {jobs.map(job => (

                                <div
                                    key={job.id}
                                    className="
                                        bg-slate-950
                                        rounded-xl
                                        p-4
                                        border
                                        border-slate-800
                                    "
                                >

                                    <div className="
                                        flex
                                        gap-4
                                        items-center
                                    ">

                                        {/* ARTWORK */}

                                        <div className="
                                            w-16
                                            h-16
                                            shrink-0
                                            rounded-lg
                                            overflow-hidden
                                            bg-slate-800
                                        ">

                                            {job.thumbnailUrl ? (

                                                <img
                                                    src={job.thumbnailUrl}
                                                    alt=""
                                                    className="
                                                        w-full
                                                        h-full
                                                        object-cover
                                                    "
                                                    onError={(e) => {
                                                        e.currentTarget.style.display =
                                                            'none';
                                                    }}
                                                />

                                            ) : (

                                                <div className="
                                                    w-full
                                                    h-full
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-slate-600
                                                    text-2xl
                                                ">
                                                    ♪
                                                </div>

                                            )}

                                        </div>

                                        {/* INFORMATION */}

                                        <div className="
                                            flex-1
                                            min-w-0
                                        ">

                                            <div className="
                                                flex
                                                items-center
                                                gap-3
                                            ">

                                                <h3 className="
                                                    font-semibold
                                                    truncate
                                                ">
                                                    {job.title ||
                                                        'Unknown title'}
                                                </h3>

                                                <span className={`
                                                    shrink-0
                                                    px-3
                                                    py-1
                                                    rounded-full
                                                    text-xs
                                                    font-semibold
                                                    ${statusClass(job.status)}
                                                `}>
                                                    {statusLabel(job.status)}
                                                </span>

                                            </div>

                                            <p className="
                                                text-slate-400
                                                text-sm
                                                mt-1
                                                truncate
                                            ">
                                                {job.artist ||
                                                    'Unknown artist'}

                                                {job.album && (
                                                    <>
                                                        {' • '}
                                                        {job.album}
                                                    </>
                                                )}
                                            </p>

                                            <div className="
                                                flex
                                                gap-4
                                                text-xs
                                                text-slate-500
                                                mt-2
                                            ">

                                                {job.durationSeconds != null && (
                                                    <span>
                                                        {formatDuration(
                                                            job.durationSeconds
                                                        )}
                                                    </span>
                                                )}

                                                <span>
                                                    {formatDate(
                                                        job.createdAt
                                                    )}
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                    {/* ERROR */}

                                    {job.status === 'FAILED' &&
                                        job.errorMessage && (

                                            <details className="
                                                mt-4
                                                border-t
                                                border-slate-800
                                                pt-3
                                            ">

                                                <summary className="
                                                    cursor-pointer
                                                    text-red-400
                                                    text-sm
                                                ">
                                                    Show error
                                                </summary>

                                                <pre className="
                                                    mt-3
                                                    bg-black
                                                    rounded-lg
                                                    p-4
                                                    text-xs
                                                    text-red-300
                                                    overflow-x-auto
                                                    whitespace-pre-wrap
                                                    break-words
                                                ">
                                                    {job.errorMessage}
                                                </pre>

                                            </details>

                                        )}

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            </div>

        </main>
    );
}

