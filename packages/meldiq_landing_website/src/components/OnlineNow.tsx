import { useEffect, useState } from "react";
import { z } from "zod";
import { ActivityPreview } from "./ActivityPreview";

const presence = z.object({ online: z.number().int().nonnegative() });

export function OnlineNow() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let refreshing = false;
    async function refresh() {
      if (document.hidden || refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/v2/site/presence", { cache: "no-store", credentials: "omit", signal: controller.signal });
        if (!response.ok) throw new Error("Presence unavailable");
        const result = presence.parse(await response.json());
        if (!controller.signal.aborted) setOnline(result.online);
      } catch {
        if (!controller.signal.aborted) setOnline(null);
      } finally {
        refreshing = false;
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      controller.abort();
    };
  }, []);

  return (
    <span className="ref-availability">
      <span className="status-dot" aria-hidden="true" />
      {online === null ? <strong>Free to use</strong> : <ActivityPreview online={online} />}
      <span aria-hidden="true">·</span> No card to start
    </span>
  );
}
