import { useEffect, useState } from "react";

const HOSTED_URL = "https://microsoft-learn-ai-guide-964320829077.us-west1.run.app/";

export function HostedGuide() {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!loaded) setTimedOut(true);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [loaded]);

  return (
    <section className="hosted-guide">
      <div className="hosted-guide-bar">
        <p className="hosted-guide-note">Using your Google AI Studio prototype engine</p>
        <a className="hosted-guide-open" href={HOSTED_URL} target="_blank" rel="noreferrer">
          Open in new tab
        </a>
      </div>
      {timedOut ? (
        <div className="hosted-guide-fallback">
          <p className="hosted-guide-fallback-text">
            Embedded view is blocked by browser/site policy. Use the direct link to run the prototype.
          </p>
          <a className="hosted-guide-open hosted-guide-open--btn" href={HOSTED_URL} target="_blank" rel="noreferrer">
            Launch prototype
          </a>
        </div>
      ) : null}
      <iframe
        className="hosted-guide-frame"
        src={HOSTED_URL}
        title="Microsoft Learn AI Guide"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
      />
    </section>
  );
}

