import { Suspense } from 'react';
import SearchContent from './searchContent';

export default function SearchPage() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}