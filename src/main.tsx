import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";
import "./boot.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:1rem;font-family:system-ui">Configuration error: no element with id="root".</p>';
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    document.getElementById("boot-banner")?.remove();
  } catch (e) {
    document.getElementById("boot-banner")?.remove();
    rootEl.innerHTML = `<div class="boot-error"><h1 class="boot-error-title">Failed to start</h1><pre class="boot-error-pre">${String(e)}</pre></div>`;
  }
}
