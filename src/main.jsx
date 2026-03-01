import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDB } from './data/db.js'

console.log("[main.jsx] starting...");

const renderApp = () => {
  console.log("[main.jsx] renderApp called");
  try {
    const rootEl = document.getElementById('root');
    if (!rootEl) {
      console.error("[main.jsx] root element not found!");
      return;
    }
    console.log("[main.jsx] root element found, calling ReactDOM.createRoot");
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("[main.jsx] React render triggered");
  } catch (error) {
    console.error("[main.jsx] Error during render:", error);
  }
};

console.log("[main.jsx] calling initDB");
initDB().then(() => {
  console.log("[main.jsx] initDB resolved, rendering app");
  renderApp();
}).catch(err => {
  console.error("[main.jsx] initDB failed:", err);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `<div style="color: red; padding: 20px;">Erreur initiale: ${err.message}</div>`;
  }
});

