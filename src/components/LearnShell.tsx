import type { ReactNode } from "react";

export function LearnShell({ children }: { children: ReactNode }) {
  return (
    <div className="learn-app">
      <a className="learn-skip" href="#learn-main">
        Skip to main content
      </a>
      <header className="learn-uhf">
        <div className="learn-uhf-inner">
          <a
            className="learn-brand-link"
            href="https://learn.microsoft.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Microsoft Learn home"
          >
            <div className="learn-wordmark" aria-hidden>
              <span className="learn-wordmark-ms">Microsoft</span>
              <span className="learn-wordmark-learn">Learn</span>
            </div>
          </a>
        </div>
      </header>
      <main id="learn-main" className="learn-simple-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
