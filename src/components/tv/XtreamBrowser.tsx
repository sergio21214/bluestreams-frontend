'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  parseXtreamCredentials,
  safeImageUrl,
  xtreamApi,
  xtreamLiveUrl,
  xtreamMovieUrl,
  xtreamSeriesUrl,
  type ActiveIptvAccount,
  type XtreamCategory,
  type XtreamEpisode,
  type XtreamLiveStream,
  type XtreamMovie,
  type XtreamSeries,
  type XtreamSeriesInfo
} from '@/lib/iptv';

type Tab = 'live' | 'series' | 'movies';

const LOAD_ERROR =
  'Could not load Xtream data. Check that the provider is online and retry.';

export default function XtreamBrowser({
  account,
  tab,
  onPlay
}: {
  account: ActiveIptvAccount;
  tab: Tab;
  onPlay: (
    src: string,
    isHls: boolean,
    title: string,
    subtitle?: string
  ) => void;
}) {
  const credentials = useMemo(
    () => parseXtreamCredentials(account),
    [account]
  );

  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [category, setCategory] = useState('');

  const [liveStreams, setLiveStreams] = useState<XtreamLiveStream[]>([]);
  const [seriesList, setSeriesList] = useState<XtreamSeries[]>([]);
  const [movies, setMovies] = useState<XtreamMovie[]>([]);

  const [selectedSeries, setSelectedSeries] =
    useState<XtreamSeries | null>(null);
  const [seriesInfo, setSeriesInfo] =
    useState<XtreamSeriesInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!credentials) {
      return;
    }

    let cancelled = false;

    setCategories([]);
    setCategory('');
    setLiveStreams([]);
    setSeriesList([]);
    setMovies([]);
    setSelectedSeries(null);
    setSeriesInfo(null);
    setSearch('');
    setError('');
    setLoading(true);

    const action =
      tab === 'live'
        ? 'get_live_categories'
        : tab === 'series'
          ? 'get_series_categories'
          : 'get_vod_categories';

    xtreamApi<XtreamCategory[]>(credentials, action)
      .then((data) => {
        if (cancelled) {
          return;
        }

        const list = Array.isArray(data) ? data : [];

        setCategories(list);
        setCategory(list[0]?.category_id ?? '');

        if (list.length === 0) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Xtream categories failed', err);

        if (!cancelled) {
          setError(
            `${LOAD_ERROR}${err instanceof Error ? ` (${err.message})` : ''}`
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [credentials, tab, reloadKey]);

  useEffect(() => {
    if (!credentials) {
      return;
    }

    if (categories.length === 0) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError('');

    const action =
      tab === 'live'
        ? 'get_live_streams'
        : tab === 'series'
          ? 'get_series'
          : 'get_vod_streams';

    const params: Record<string, string> = category
      ? { category_id: category }
      : {};

    xtreamApi<
      XtreamLiveStream[] | XtreamSeries[] | XtreamMovie[]
    >(credentials, action, params)
      .then((data) => {
        if (cancelled) {
          return;
        }

        const list = Array.isArray(data) ? data : [];

        if (tab === 'live') {
          setLiveStreams(list as XtreamLiveStream[]);
        } else if (tab === 'series') {
          setSeriesList(list as XtreamSeries[]);
        } else {
          setMovies(list as XtreamMovie[]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Xtream list failed', err);

        if (!cancelled) {
          setError(
            `${LOAD_ERROR}${err instanceof Error ? ` (${err.message})` : ''}`
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [credentials, tab, category, categories.length, reloadKey]);

  async function openSeries(series: XtreamSeries) {
    if (!credentials) {
      return;
    }

    setSelectedSeries(series);
    setSeriesInfo(null);
    setLoadingSeries(true);

    try {
      const info = await xtreamApi<XtreamSeriesInfo>(
        credentials,
        'get_series_info',
        { series_id: String(series.series_id) }
      );

      setSeriesInfo(info);
    } catch (err) {
      console.error('Xtream series info failed', err);
      setError(
        `${LOAD_ERROR}${err instanceof Error ? ` (${err.message})` : ''}`
      );
    } finally {
      setLoadingSeries(false);
    }
  }

  function playEpisode(
    series: XtreamSeries,
    season: string,
    episode: XtreamEpisode
  ) {
    if (!credentials) {
      return;
    }

    onPlay(
      xtreamSeriesUrl(
        credentials,
        episode.id,
        episode.container_extension
      ),
      false,
      `${series.name} • S${season}E${episode.episode_num ?? ''}`,
      episode.title ?? undefined
    );
  }

  const term = search.trim().toLowerCase();

  const categoryName =
    categories.find((item) => item.category_id === category)
      ?.category_name ?? '';

  const filteredLive = term
    ? liveStreams.filter((item) =>
        item.name.toLowerCase().includes(term)
      )
    : liveStreams;

  const filteredSeries = term
    ? seriesList.filter((item) =>
        item.name.toLowerCase().includes(term)
      )
    : seriesList;

  const filteredMovies = term
    ? movies.filter((item) =>
        item.name.toLowerCase().includes(term)
      )
    : movies;

  if (!credentials) {
    return (
      <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
        {error || 'Invalid Xtream account URL.'}
      </p>
    );
  }

  return (
    <div>

      {selectedSeries ? (
        <SeriesDetail
          series={selectedSeries}
          info={seriesInfo}
          loading={loadingSeries}
          error={error}
          onBack={() => {
            setSelectedSeries(null);
            setSeriesInfo(null);
          }}
          onPlay={playEpisode}
        />
      ) : (
        <>

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-bold text-white">
                {tab === 'live'
                  ? 'Live channels'
                  : tab === 'series'
                    ? 'Series'
                    : 'Movies'}
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                {loading
                  ? 'Loading...'
                  : `${filteredLive.length + filteredSeries.length + filteredMovies.length} results`}
                {categoryName ? ` • ${categoryName}` : ''}
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="
                w-full
                rounded-full
                border
                border-white/10
                bg-white/5
                px-4
                py-2.5
                text-sm
                text-white
                outline-none
                placeholder:text-zinc-500
                focus:border-blue-500/60
                lg:w-72
              "
            />

          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">

            <button
              type="button"
              onClick={() => setCategory('')}
              className={`
                shrink-0
                rounded-full
                px-3
                py-1.5
                text-xs
                font-semibold
                transition
                ${
                  category === ''
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }
              `}
            >
              All
            </button>

            {categories
              .filter((item) => item.category_id)
              .map((item) => (
                <button
                  type="button"
                  key={item.category_id}
                  onClick={() => setCategory(item.category_id ?? '')}
                  className={`
                    shrink-0
                    rounded-full
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    transition
                    ${
                      category === item.category_id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }
                  `}
                >
                  {item.category_name}
                </button>
              ))}

          </div>

          {error && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="
                  shrink-0
                  self-start
                  rounded-full
                  bg-red-500/20
                  px-4
                  py-1.5
                  text-xs
                  font-semibold
                  text-red-200
                  transition
                  hover:bg-red-500/30
                  sm:self-auto
                "
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
            </div>
          ) : tab === 'live' ? (
            <LiveList
              items={filteredLive.slice(0, 500)}
              total={filteredLive.length}
              onPlay={(item) =>
                onPlay(
                  xtreamLiveUrl(credentials, item.stream_id),
                  true,
                  item.name,
                  categoryName
                )
              }
            />
          ) : tab === 'series' ? (
            <PosterGrid
              items={filteredSeries.slice(0, 300).map((item) => ({
                key: String(item.series_id),
                image: safeImageUrl(item.cover),
                title: item.name,
                subtitle: item.rating ? `★ ${item.rating}` : item.genre ?? undefined,
                onClick: () => openSeries(item)
              }))}
              total={filteredSeries.length}
            />
          ) : (
            <PosterGrid
              items={filteredMovies.slice(0, 300).map((item) => ({
                key: String(item.stream_id),
                image: safeImageUrl(item.stream_icon),
                title: item.name,
                subtitle: item.rating ? `★ ${item.rating}` : item.container_extension ?? undefined,
                onClick: () =>
                  onPlay(
                    xtreamMovieUrl(
                      credentials,
                      item.stream_id,
                      item.container_extension
                    ),
                    false,
                    item.name,
                    item.container_extension ?? undefined
                  )
              }))}
              total={filteredMovies.length}
            />
          )}

        </>
      )}

    </div>
  );
}

function LiveList({
  items,
  total,
  onPlay
}: {
  items: XtreamLiveStream[];
  total: number;
  onPlay: (item: XtreamLiveStream) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-500">
        No channels found.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">

      {items.map((item) => (
        <button
          type="button"
          key={item.stream_id}
          onClick={() => onPlay(item)}
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            border
            border-transparent
            bg-white/[0.03]
            px-3
            py-2.5
            text-left
            transition
            hover:border-blue-500/30
            hover:bg-white/[0.07]
          "
        >

          <ChannelLogo src={item.stream_icon} />

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">
              {item.name}
            </span>
            <span className="block truncate text-xs text-zinc-500">
              Live TV
            </span>
          </span>

          <span className="shrink-0 text-xs text-blue-400">
            Watch
          </span>

        </button>
      ))}

      {total > items.length && (
        <p className="pt-2 text-center text-xs text-zinc-500">
          Showing the first {items.length} channels. Use search or a category to
          narrow the list.
        </p>
      )}

    </div>
  );
}

function ChannelLogo({ src }: { src?: string | null }) {
  const safeSrc = safeImageUrl(src);

  if (!safeSrc || !/^https?:\/\//i.test(safeSrc)) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-blue-300">
        ▶
      </span>
    );
  }

  return (
    <img
      src={safeSrc}
      alt=""
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
      className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-1"
    />
  );
}

function PosterGrid({
  items,
  total
}: {
  items: {
    key: string;
    image?: string | null;
    title: string;
    subtitle?: string;
    onClick: () => void;
  }[];
  total: number;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-500">
        Nothing found.
      </p>
    );
  }

  return (
    <div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">

        {items.map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={item.onClick}
            className="
              group
              overflow-hidden
              rounded-2xl
              border
              border-white/5
              bg-white/[0.03]
              text-left
              transition
              hover:border-blue-500/30
              hover:bg-white/[0.06]
            "
          >

            <div className="aspect-[2/3] overflow-hidden bg-zinc-900">

              {item.image && /^https?:\/\//i.test(item.image) ? (
                <img
                  src={item.image}
                  alt={item.title}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900/40 to-slate-900 text-3xl text-blue-300/50">
                  ▶
                </div>
              )}

            </div>

            <div className="p-3">
              <p className="truncate text-sm font-semibold text-white">
                {item.title}
              </p>

              {item.subtitle && (
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {item.subtitle}
                </p>
              )}
            </div>

          </button>
        ))}

      </div>

      {total > items.length && (
        <p className="pt-4 text-center text-xs text-zinc-500">
          Showing the first {items.length} items. Use search or a category to
          narrow the list.
        </p>
      )}

    </div>
  );
}

function SeriesDetail({
  series,
  info,
  loading,
  error,
  onBack,
  onPlay
}: {
  series: XtreamSeries;
  info: XtreamSeriesInfo | null;
  loading: boolean;
  error: string;
  onBack: () => void;
  onPlay: (
    series: XtreamSeries,
    season: string,
    episode: XtreamEpisode
  ) => void;
}) {
  const seasons = Object.entries(info?.episodes ?? {}).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );

  return (
    <div>

      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        ← Back to series
      </button>

      <div className="mb-6 flex flex-col gap-5 sm:flex-row">

        {safeImageUrl(series.cover) && (
          <img
            src={safeImageUrl(series.cover) ?? ''}
            alt={series.name}
            className="h-56 w-40 shrink-0 rounded-2xl object-cover"
          />
        )}

        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white">
            {series.name}
          </h2>

          {series.genre && (
            <p className="mt-1 text-sm text-blue-300">
              {series.genre}
            </p>
          )}

          {series.plot && (
            <p className="mt-3 line-clamp-5 text-sm text-zinc-400">
              {series.plot}
            </p>
          )}
        </div>

      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </p>
      ) : seasons.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-500">
          No episodes available.
        </p>
      ) : (
        <div className="space-y-6">

          {seasons.map(([season, episodes]) => (
            <section key={season}>

              <h3 className="mb-3 text-lg font-bold text-white">
                Season {season}
              </h3>

              <div className="space-y-1.5">

                {episodes.map((episode) => (
                  <button
                    type="button"
                    key={`${season}-${episode.id}`}
                    onClick={() => onPlay(series, season, episode)}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      bg-white/[0.03]
                      px-4
                      py-3
                      text-left
                      transition
                      hover:bg-white/[0.07]
                    "
                  >

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-sm font-semibold text-blue-300">
                      {episode.episode_num ?? '•'}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {episode.title || `Episode ${episode.episode_num ?? ''}`}
                      </span>

                      {episode.info?.duration && (
                        <span className="block text-xs text-zinc-500">
                          {episode.info.duration}
                        </span>
                      )}
                    </span>

                    <span className="shrink-0 text-xs text-blue-400">
                      Play
                    </span>

                  </button>
                ))}

              </div>

            </section>
          ))}

        </div>
      )}

    </div>
  );
}
