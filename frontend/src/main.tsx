/*
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker (vite-plugin-pwa auto-generates src/sw.ts)
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    // Show a custom toast / banner here if desired
    const ok = window.confirm(
      "A new version of Neethivaan is available. Refresh now?"
    );
    if (ok) updateSW(true);
  },
  onOfflineReady() {
    console.log("✅  Neethivaan is ready to work offline.");
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
*/
