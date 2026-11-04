import CollectionPage from '@/components/music/CollectionPage';

export default function RecentPage() {
  return (
    <CollectionPage
      title="Recently Played"
      subtitle="Every song you have listened to lately, in the order you played it."
      endpoint="/music/history/recent"
      gradient="from-blue-600 via-blue-800 to-[#050b18]"
      emptyText="Nothing played yet. Pick a song from your library."
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
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5l3 2" />
        </svg>
      }
    />
  );
}
