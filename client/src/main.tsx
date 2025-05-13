import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create root with fallback for getElementById returning null
const rootElement = document.getElementById("root");
if (!rootElement) {
  // Create a root element if it doesn't exist
  console.error("Root element not found, creating one");
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
}

const root = createRoot(document.getElementById("root") || document.body);

// Wrap with React.StrictMode and add error handling
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to render app:", error);
  
  // Fallback render in case of error
  root.render(
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'white'
    }}>
      <h1 style={{ color: '#e53e3e', marginBottom: '1rem' }}>App Error</h1>
      <p style={{ maxWidth: '400px', textAlign: 'center', marginBottom: '1rem' }}>
        There was a problem loading the application. Please try refreshing the page or contact support.
      </p>
      <button 
        style={{ 
          backgroundColor: '#3182ce', 
          color: 'white', 
          border: 'none', 
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  );
}
