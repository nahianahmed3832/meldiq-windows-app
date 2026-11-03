import { useEffect, useState } from "react";
import { getActivityPreview } from "../lib/activityPreview";

export function ActivityPreview() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let timer: number;
    const refresh = () => {
      const now = Date.now();
      setCount(getActivityPreview(now));
      timer = window.setTimeout(refresh, 60_000 - (now % 60_000) + 20);
    };
    const resume = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timer);
        refresh();
      }
    };
    refresh();
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  return (
    <span className="ref-activity-preview" title="Simulated activity for this preview. This is not a live user count.">
      <strong>{count === null ? "—" : count.toLocaleString("en-US")}</strong> people melding now
    </span>
  );
}
