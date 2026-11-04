import CollectionPage from '@/components/music/CollectionPage';

export default function RepeatPage() {
  return (
    <CollectionPage
      title="On Repeat"
      subtitle="The songs you keep coming back to, ranked by how often you play them."
      endpoint="/music/history/repeat"
      gradient="from-cyan-500 via-blue-700 to-[#050b18]"
      showPlayCount
      emptyText="Play a few songs and your repeat favourites will show up here."
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12"
        >
          <path d="M17 2l4 4-4 4" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <path d="M7 22l-4-4 4-4" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      }
    />
  );
}
