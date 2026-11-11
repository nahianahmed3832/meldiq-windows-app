import { useEffect, useState } from "react";
import { analyticsId, readAnalyticsChoice, recordDownloadClick, recordPublicPage, saveAnalyticsChoice } from "../lib/analytics";

export function AnalyticsChoice({ path }: { path: string }) {
  const [choice, setChoice] = useState<ReturnType<typeof readAnalyticsChoice>>();
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (analyticsId) setChoice(readAnalyticsChoice());
  }, []);
  useEffect(() => {
    if (choice !== "allowed") return;
    recordPublicPage(path);
    const onClick = (event: MouseEvent) => {
      if (event.type === "auxclick" && event.button !== 1) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      recordDownloadClick(anchor);
      // A tagged document must never acquire a query string through a client
      // navigation. Give links to those URLs a new document.
      if (
        event.type === "click" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        (!anchor.target || anchor.target === "_self") &&
        anchor.origin === location.origin &&
        anchor.search
      ) {
        event.preventDefault();
        window.location.assign(anchor.href);
      }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, [choice, path]);

  if (!analyticsId || choice === undefined) return null;

  function select(value: "allowed" | "denied") {
    saveAnalyticsChoice(value);
    setChoice(value);
    setEditing(false);
  }

  return (
    <div className="analytics-choice" lang="en">
      {choice === null || editing ? (
        <section className="analytics-banner" aria-labelledby="analytics-title">
          <h2 id="analytics-title">Analytics preferences</h2>
          <p>
            Allow optional analytics to help us understand visits and download clicks. <a href="/legal/privacy">Privacy policy</a>
          </p>
          <div>
            <button type="button" onClick={() => select("denied")}>
              No thanks
            </button>
            <button type="button" onClick={() => select("allowed")}>
              Allow analytics
            </button>
          </div>
        </section>
      ) : (
        <button type="button" className="analytics-settings" onClick={() => setEditing(true)}>
          Analytics preferences
        </button>
      )}
    </div>
  );
}
