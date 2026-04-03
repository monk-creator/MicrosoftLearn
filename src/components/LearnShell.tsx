import type { ReactNode } from "react";

const NAV = [
  { label: "Documentation", href: "https://learn.microsoft.com/en-us/docs/" },
  { label: "Training", href: "https://learn.microsoft.com/en-us/training/" },
  { label: "Q&A", href: "https://learn.microsoft.com/en-us/answers/" },
  { label: "Credentials", href: "https://learn.microsoft.com/en-us/credentials/" },
];

export function LearnShell({
  children,
  breadcrumbCurrentLabel = "AI Guide (local)",
}: {
  children: ReactNode;
  breadcrumbCurrentLabel?: string;
}) {
  return (
    <div className="learn-app">
      <a className="learn-skip" href="#learn-main">
        Skip to main content
      </a>
      <header className="learn-uhf">
        <div className="learn-uhf-inner">
          <div className="learn-wordmark" aria-hidden>
            <span className="learn-wordmark-ms">Microsoft</span>
            <span className="learn-wordmark-learn">Learn</span>
          </div>
          <span className="learn-demo-pill">Personal demo</span>
          <nav className="learn-uhf-nav" aria-label="Primary">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <div className="learn-breadcrumb-bar">
        <div className="learn-breadcrumb-inner">
          <ol className="learn-breadcrumb">
            <li>
              <a href="https://learn.microsoft.com/" target="_blank" rel="noreferrer">
                Learn
              </a>
            </li>
            <li aria-hidden>/</li>
            <li>
              <a href="https://learn.microsoft.com/en-us/training/" target="_blank" rel="noreferrer">
                Training
              </a>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{breadcrumbCurrentLabel}</li>
          </ol>
        </div>
      </div>
      <div className="learn-body">
        <aside className="learn-sidebar" aria-label="Training navigation">
          <p className="learn-sidebar-heading">Training</p>
          <ul className="learn-sidebar-list">
            <li>
              <a href="https://learn.microsoft.com/en-us/training/browse/" target="_blank" rel="noreferrer">
                Browse all training
              </a>
            </li>
            <li>
              <a href="https://learn.microsoft.com/en-us/training/roles/" target="_blank" rel="noreferrer">
                Roles
              </a>
            </li>
            <li>
              <a href="https://learn.microsoft.com/en-us/training/topics/" target="_blank" rel="noreferrer">
                Topics
              </a>
            </li>
          </ul>
          <p className="learn-sidebar-note">
            Links open the real Microsoft Learn site. Recommendations in the chat use the same official URLs from
            the catalog.
          </p>
        </aside>
        <main id="learn-main" className="learn-main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <footer className="learn-footer">
        <p>
          This page is a personal learning UI prototype. Training titles and links mirror{" "}
          <a href="https://learn.microsoft.com/en-us/training/browse/" target="_blank" rel="noreferrer">
            Microsoft Learn
          </a>
          ; it is not hosted or endorsed by Microsoft.
        </p>
      </footer>
    </div>
  );
}
