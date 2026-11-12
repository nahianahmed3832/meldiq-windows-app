import { RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useEngine } from "../../application/orbit";
import { MAX_BYTES, MAX_ITEMS, planSave, type SaveItem, saveKey, type SaveStatus, saveSummary } from "../../sync/bulkSave";
import { canPickFolder, type DirHandle, pickFolder, runBulkSave } from "../../sync/bulkSaver";
import { bytes } from "../format";
import { Icon } from "../icons/Icon";

type FileChoice = Pick<SaveItem, "messageId" | "ref">;

export const itemKey = (i: FileChoice): string => saveKey(i.messageId, i.ref.id);

interface Run {
  items: SaveItem[];
  dir: DirHandle | null;
  status: Record<string, SaveStatus>;
  errors: Record<string, string>;
}

/** Selection and saving of several files from the media gallery (android round 7 bulk select and save). */
export function useBulkSave() {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const stop = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const include = (keys: string[]) => {
    setSelecting(true);
    setSelected((cur) => new Set([...cur, ...keys]));
  };
  return {
    include,
    selecting,
    start: () => setSelecting(true),
    stop,
    selected,
    toggle,
    selectAll: (keys: string[]) => setSelected(new Set(keys)),
  };
}

/** Download the selected files and show progress, cancellation and retry. */
export function BulkSaveBar({ all, bulk, chat = false }: { all: FileChoice[]; bulk: ReturnType<typeof useBulkSave>; chat?: boolean }) {
  const engine = useEngine();
  const [run, setRun] = useState<Run | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const choosing = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);
  const selected = all.filter((i) => bulk.selected.has(itemKey(i)));
  const summary = run ? saveSummary(run.status) : null;

  const start = async (items: SaveItem[], dir: DirHandle | null) => {
    if (!mounted.current || active.current) return;
    const control = new AbortController();
    active.current = control;
    const status = Object.fromEntries(items.map((i) => [i.key, "waiting" as SaveStatus]));
    setRun({ items, dir, status, errors: {} });
    try {
      await runBulkSave(
        engine,
        items,
        dir,
        (key, s, error) =>
          setRun((r) =>
            r
              ? {
                  ...r,
                  status: { ...r.status, [key]: s },
                  errors: error ? { ...r.errors, [key]: error } : r.errors,
                }
              : r,
          ),
        () => control.signal.aborted,
        control.signal,
      );
    } finally {
      active.current = null;
    }
  };

  const save = async () => {
    if (choosing.current || active.current) return;
    setProblem(null);
    const plan = planSave(selected);
    if (plan.kind === "empty") return setProblem("Select the files to save first.");
    if (plan.kind === "tooMany") return setProblem(`That's ${plan.count} files. Save at most ${MAX_ITEMS} at a time, in parts.`);
    if (plan.kind === "tooLarge") return setProblem(`That's ${bytes(plan.bytes)}. Save at most ${bytes(MAX_BYTES)} at a time, in parts.`);
    let dir: DirHandle | null = null;
    if (canPickFolder()) {
      choosing.current = true;
      try {
        dir = await pickFolder();
      } catch {
        return setProblem("That folder can't be written to. Choose another.");
      } finally {
        choosing.current = false;
      }
      if (!dir) return; // the picker was closed
    }
    await start(plan.items, dir);
  };

  const retry = () => {
    if (!run) return;
    const again = run.items.filter((i) => run.status[i.key] === "failed" || run.status[i.key] === "cancelled");
    void start(again, run.dir);
  };

  if (run && summary) {
    const firstError = Object.values(run.errors)[0];
    return (
      <div className="bulk-bar" role="status" aria-live="polite">
        <span className="grow">
          {summary.running ? `Saving ${summary.saved + summary.failed + 1} of ${summary.total}…` : `Saved ${summary.saved} of ${summary.total}`}
          {summary.failed ? ` · ${summary.failed} failed` : ""}
          {summary.cancelled ? ` · ${summary.cancelled} stopped` : ""}
          {!summary.running && firstError && <small className="faint"> · {firstError}</small>}
        </span>
        {summary.running ? (
          <button className="btn btn-secondary btn-sm" onClick={() => active.current?.abort()}>
            <Square size={13} /> Stop
          </button>
        ) : (
          <>
            {summary.retryable > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={retry}>
                <RotateCcw size={13} /> Retry {summary.retryable}
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setRun(null);
                bulk.stop();
              }}
            >
              Done
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bulk-bar">
      <span className="grow">
        {selected.length === 1 ? "1 file selected" : `${selected.length} files selected`}
        {problem && <small className="danger-text"> · {problem}</small>}
      </span>
      {!chat && (
        <button className="btn btn-ghost btn-sm" onClick={() => bulk.selectAll(all.map(itemKey))}>
          Select all
        </button>
      )}
      <button className="btn btn-primary btn-sm" onClick={() => void save()} disabled={selected.length === 0}>
        <Icon name="files.download" size={16} /> {canPickFolder() && !chat ? "Save to a folder…" : "Download"}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={bulk.stop} aria-label={chat ? undefined : "Stop selecting"}>
        Cancel
      </button>
    </div>
  );
}
