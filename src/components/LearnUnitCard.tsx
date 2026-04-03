import type { LearnChunk } from "../types";

function IconClock() {
  return (
    <svg className="unit-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm-.5 2.5v4.25l3.5 2.1.5-.86-3-1.8V4.5h-1z"
      />
    </svg>
  );
}

function IconOpen() {
  return (
    <svg className="unit-icon unit-icon--external" width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M4 3h8v8h-1V4.7L4.9 11 4 10.1 10.3 4H4V3z"
      />
    </svg>
  );
}

export function LearnUnitCard({
  chunk,
  variant = "primary",
  headingId,
}: {
  chunk: LearnChunk;
  variant?: "primary" | "compact" | "alternate";
  /** For aria-labelledby on the card region */
  headingId?: string;
}) {
  if (variant === "alternate") {
    return (
      <article className="unit-card unit-card--alternate" aria-labelledby={headingId}>
        <div className="unit-alt-main">
          <span className="unit-type">{chunk.contentType}</span>
          <h3 className="unit-title unit-title--alt" id={headingId}>
            <a href={chunk.url} target="_blank" rel="noreferrer">
              {chunk.title}
              <IconOpen />
            </a>
          </h3>
        </div>
        <div className="unit-alt-meta">
          <span className="unit-meta-item">
            <IconClock />
            {chunk.duration}
          </span>
          <span className="unit-pill unit-pill--level">{chunk.level}</span>
        </div>
      </article>
    );
  }

  const isCompact = variant === "compact";

  return (
    <article
      className={`unit-card unit-card--${variant}`}
      aria-labelledby={headingId}
    >
      <div className="unit-card-top">
        <span className="unit-type">{chunk.contentType}</span>
        <div className="unit-meta">
          <span className="unit-meta-item">
            <IconClock />
            {chunk.duration}
          </span>
          <span className="unit-pill unit-pill--level">{chunk.level}</span>
        </div>
      </div>
      <h3 className={isCompact ? "unit-title unit-title--sm" : "unit-title"} id={headingId}>
        <a href={chunk.url} target="_blank" rel="noreferrer">
          {chunk.title}
          <IconOpen />
        </a>
      </h3>
      <div className="unit-tags">
        {chunk.products.map((p) => (
          <span key={p} className="unit-pill unit-pill--product">
            {p}
          </span>
        ))}
        {chunk.roles.slice(0, 3).map((r) => (
          <span key={r} className="unit-pill unit-pill--role">
            {r}
          </span>
        ))}
      </div>
      <a className="unit-cta" href={chunk.url} target="_blank" rel="noreferrer">
        Start on Microsoft Learn
        <IconOpen />
      </a>
    </article>
  );
}
