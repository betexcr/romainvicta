import React from 'react';
import { createRoot } from 'react-dom/client';
import RomanGlobe from './RomanGlobe.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { installClientObservability } from './lib/observability.js';

installClientObservability();

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <RomanGlobe />
    </ErrorBoundary>
  );
}
