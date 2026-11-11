import { useEffect, useState } from "react";
import { ACTIVITY_PREVIEW_INTERVAL_MS, getActivityPreview } from "../lib/activityPreview";

export function ActivityPreview({ online }: { online: number }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let timer: number;
    const refresh = () => {
      const now = Date.now();
      setCount(getActivityPreview(now));
      timer = window.setTimeout(refresh, ACTIVITY_PREVIEW_INTERVAL_MS - (now % ACTIVITY_PREVIEW_INTERVAL_MS));
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

  return count === null ? null : (
    <span>
      <strong>{(online + count).toLocaleString("en-US")}</strong> people online now
    </span>
  );
}
