import { useMemo } from "react";

export function LearnLanding({ onOpenGuide }: { onOpenGuide: () => void }) {
  const heroChips = useMemo(
    () => [
      { label: "Documentation", href: "https://learn.microsoft.com/en-us/docs/" },
      { label: "Training", href: "https://learn.microsoft.com/en-us/training/" },
      { label: "Q&A", href: "https://learn.microsoft.com/en-us/answers/" },
      { label: "Credentials", href: "https://learn.microsoft.com/en-us/credentials/" },
    ],
    [],
  );

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1 className="landing-hero-title">Learning for everyone, everywhere</h1>
          <p className="landing-hero-lede">
            Explore Microsoft product documentation, training, credentials, Q&amp;A, code references,
            and shows.
          </p>

          <div className="landing-search">
            <label className="landing-search-label" htmlFor="learn-search">
              Search
            </label>
            <input
              id="learn-search"
              className="landing-search-input"
              placeholder="Try: Azure fundamentals, Power BI, Sentinel…"
              disabled
            />
            <p className="landing-search-hint">
              This is a local UI prototype; recommendations come from the AI Guide chat.
            </p>
          </div>

          <div className="landing-hero-actions">
            <button type="button" className="landing-primary" onClick={onOpenGuide}>
              Open AI Guide
            </button>
            <a className="landing-link" href="https://learn.microsoft.com/en-us/training/browse/">
              Browse training
            </a>
          </div>

          <div className="landing-hero-chips" aria-label="Quick links">
            {heroChips.map((c) => (
              <a key={c.href} className="landing-chip" href={c.href} target="_blank" rel="noreferrer">
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Popular technical resources and training</h2>
        <div className="landing-card-grid">
          <div className="landing-card">
            <h3 className="landing-card-title">Discover AI, Azure, and Copilot essentials</h3>
            <p className="landing-card-text">
              Develop knowledge and skills faster with the latest resources and expert insights.
            </p>
            <a className="landing-card-cta" href="https://learn.microsoft.com/en-us/docs/" target="_blank" rel="noreferrer">
              Browse product documentation
            </a>
          </div>

          <div className="landing-card">
            <h3 className="landing-card-title">Take in-demand training</h3>
            <p className="landing-card-text">
              Advance your technical career with training and verified credentials.
            </p>
            <a className="landing-card-cta" href="https://learn.microsoft.com/en-us/training/" target="_blank" rel="noreferrer">
              Browse all training
            </a>
          </div>

          <div className="landing-card">
            <h3 className="landing-card-title">Additional resources</h3>
            <p className="landing-card-text">
              Ask our developer community tech questions or gain applied skills and verified certifications.
            </p>
            <div className="landing-card-cta-row">
              <a className="landing-card-cta landing-card-cta--ghost" href="https://learn.microsoft.com/en-us/answers/" target="_blank" rel="noreferrer">
                Ask a question
              </a>
              <a className="landing-card-cta landing-card-cta--ghost" href="https://learn.microsoft.com/en-us/credentials/" target="_blank" rel="noreferrer">
                Earn credentials
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-mcp">
        <h2 className="landing-section-title">Get started with Microsoft Learn MCP Server</h2>
        <div className="landing-mcp-row">
          <p className="landing-mcp-text">
            Create a custom agent that uses Learn MCP Server to answer all its users' questions with trusted Microsoft documentation.
          </p>
          <a className="landing-primary" href="https://learn.microsoft.com/en-us/training/support/mcp-get-started" target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            Start building
          </a>
        </div>
      </section>
    </div>
  );
}

