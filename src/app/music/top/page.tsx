import CollectionPage from '@/components/music/CollectionPage';

export default function TopPage() {
  return (
    <CollectionPage
      title="Most Played"
      subtitle="Your all-time favourites, ordered by the number of plays."
      endpoint="/music/history/top"
      gradient="from-indigo-500 via-blue-700 to-[#050b18]"
      showPlayCount
      emptyText="Your most played songs will appear here once you start listening."
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
          <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z" />
        </svg>
      }
    />
  );
}
