// Import the fix first
import './vite-fix';
import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import ErrorBoundary from '@/components/error-boundary';

// Wrap the app with the error boundary
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found in the DOM");
}
