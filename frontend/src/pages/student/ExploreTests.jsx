// frontend/src/pages/student/ExploreTests.jsx
import React from 'react';
import AllMockTests from '../AllMockTests';

/**
 * Renders the AllMockTests component optimized for embedding 
 * inside the student dashboard as a dedicated tab.
 */
export default function ExploreTests() {
  return (
    // Pass isEmbedded prop to tell AllMockTests to adjust styling 
    // (remove page-level padding/background, use light text colors, etc.)
    <AllMockTests isEmbedded={true} />
  );
}