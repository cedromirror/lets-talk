import React, { Suspense, lazy } from 'react';
import ExploreFallback from './ExploreFallback';

// Lazy load the Explore component
const Explore = lazy(() => import('./Explore'));

const ExploreWrapper = () => {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <Explore />
    </Suspense>
  );
};

export default ExploreWrapper;
