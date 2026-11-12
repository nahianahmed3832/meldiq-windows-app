import { X, Film, Image as ImageIcon, Pause, Play, TriangleAlert } from "lucide-react";
import { type ReactNode, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useEngine, useOrbit } from "../../application/orbit";
import { usePrefs } from "../../application/prefs";
import { useVoicePlayback, voicePlayback } from "../../application/voicePlayback";
import type { StoredMessage } from "../../model/types";
import { galleryOf } from "./gallery";
import type { AttachmentRef } from "../../protocol/payload";
import { type DownloadProgress, isInlineImage, safeMime, saveAttachment } from "../../sync/attachments";
import { clock, isVoice, shownDuration } from "../../sync/voice";
import { attachmentName, riskyAttachment } from "../../sync/attachmentPolicy";
import { saveKey } from "../../sync/bulkSave";
import { bytes } from "../format";
import { Icon } from "../icons/Icon";
import { albumOverflow, albumRows } from "./album";
import { ChatFileSelection } from "./ChatFileSelection";
import { useNearScreen } from "./useNearScreen";
import { useBlobUrl } from "./blobUrl";
import { isVideo, isViewable, MediaViewer, OpenViewerContext, type ViewerInfo, ViewerInfoContext } from "./MediaViewer";

export type { ViewerInfo };

/**
 * Decrypts on demand. Images show inline once scrolled near; voice messages play in place (android VoiceViews); audio and video play inline
 * once opened (a click, so nothing large downloads unasked); anything else is a file card that downloads.
 */
export function Attachments({ refs, viewer, message }: { refs: AttachmentRef[]; viewer?: ViewerInfo; message?: StoredMessage }) {
  const engine = useEngine();
  const bulk = useContext(ChatFileSelection);
  const selecting = !!(message && bulk?.selecting);
  const [viewing, setViewing] = useState<string | null>(null);
  // Only subscribe to conversation history while open. Keep the selected attachment stable as new messages arrive.
  const messages = useOrbit((s) => (viewing && message ? s.messages[message.conversationId]?.items : undefined));
  const users = useOrbit((s) => (viewing ? s.users : undefined));
  const me = useOrbit((s) => (viewing ? s.me : undefined));
  const gallery = useMemo(
    () => galleryOf(messages?.some((m) => m.id === message?.id) ? messages : [...(messages ?? []), ...(message ? [message] : [])]).media.sort((a, b) => a.at - b.at),
    [messages, message],
  );
  const media = gallery.length ? gallery.map((i) => i.ref) : refs.filter((r) => !isVoice(r) && isViewable(r));
  const at = media.findIndex((r) => r.id === viewing);
  const source = messages?.find((m) => m.id === gallery[at]?.messageId);
  const info: ViewerInfo | null =
    source && source.id !== message?.id
      ? {
          sender: source.senderUserId === me?.userId ? me.displayName : (users?.[source.senderUserId]?.displayName ?? "Member"),
          at: source.sortTs,
          text: source.text,
          quick: viewer?.quick ?? [],
          reacted: Object.entries(source.reactions)
            .filter(([, who]) => me && who.includes(me.userId))
            .map(([emoji]) => emoji),
          onReact: viewer?.onReact ? (emoji) => void engine.react(source, emoji) : null,
        }
      : (viewer ?? null);
  if (!refs.length) return null;
  // Several photos sent together are an album (android AlbumGrid); everything else is listed under it.
  const images = refs.filter((r) => !isVoice(r) && isInlineImage(r));
  const album = images.length >= 2 ? images : [];
  const rest = album.length ? refs.filter((r) => !album.includes(r)) : refs;
  const open = (r: AttachmentRef) => setViewing(r.id);
  return (
    <ViewerInfoContext.Provider value={info}>
      <OpenViewerContext.Provider value={open}>
        <div className="attachments" hidden={selecting}>
          {album.length > 0 && <AlbumGrid items={album} />}
          {rest.map((r) => (
            <div className="chat-attachment" key={r.id} data-attachment-id={r.id}>
              {isVoice(r) ? <VoiceAttachment r={r} /> : isInlineImage(r) ? <ImageAttachment r={r} withDownload /> : isPlayable(r) ? <MediaAttachment r={r} withDownload /> : <FileAttachment r={r} />}
            </div>
          ))}
        </div>
        {selecting && message && bulk && (
          <div className="attachments attachment-choices" role="group" aria-label="Select attachments">
            {refs.map((ref) => {
              const key = saveKey(message.id, ref.id);
              const name = attachmentName(ref.name);
              return (
                <label className="att-file attachment-choice" data-attachment-id={ref.id} key={key}>
                  <input type="checkbox" aria-label={`Select ${name}`} checked={bulk.selected.has(key)} onChange={() => bulk.toggle(key)} />
                  <span className="grow">
                    <strong className="ellipsis">{name}</strong>
                    <small>{bytes(ref.size)}</small>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {viewing !== null && at >= 0 && <MediaViewer items={media} at={at} onMove={(i) => setViewing(media[i].id)} onClose={() => setViewing(null)} />}
      </OpenViewerContext.Provider>
    </ViewerInfoContext.Provider>
  );
}

/** Opens [r] in the message's viewer, or in a viewer of its own where it's shown outside a message (galleries). */
function useViewer(r: AttachmentRef): {
  open: () => void;
  own: React.ReactNode;
} {
  const shared = useContext(OpenViewerContext);
  const [alone, setAlone] = useState(false);
  return {
    open: () => (shared ? shared(r) : setAlone(true)),
    own: alone ? <MediaViewer items={[r]} at={0} onMove={() => undefined} onClose={() => setAlone(false)} /> : null,
  };
}

const isPlayable = (r: AttachmentRef): boolean => /^(audio|video)\//.test(safeMime(r.mime));

/**
 * A voice message: play/pause, a seek bar, its length and speed; the first play downloads and decrypts it. It plays
 * through the page's one voice player (application/voicePlayback.ts), so starting it pauses any other at once.
 */
function VoiceAttachment({ r }: { r: AttachmentRef }) {
  // Each drawing of a message is its own clip: the same message in a panel and in the conversation has two players.
  const key = `${r.id}${useId()}`;
  const playback = useVoicePlayback();
  const [wanted, setWanted] = useState(false);
  const { url, error, loading } = useBlobUrl(r, wanted);
  useEffect(() => {
    if (url) voicePlayback.provide(key, url);
  }, [key, url]);
  // Leaving the conversation or closing the panel stops it.
  useEffect(() => () => voicePlayback.release(key), [key]);
  const total = shownDuration(r.durationMs);
  if (error) return <FileAttachment r={r} error={error} />;
  const mine = playback.key === key;
  const playing = mine && playback.status === "playing";
  const busy = mine && playback.status === "loading" && (loading || !url);
  const pos = mine ? playback.positionMs : voicePlayback.positionOf(key);
  const seconds = Math.round(total / 1000);
  return (
    <PreviewDownload r={r}>
      <div className={`voice-msg${playing ? " playing" : ""}`} role="group" aria-label={`Voice message, ${seconds} seconds`} data-voice-state={mine ? playback.status : "idle"}>
        <button
          className="voice-play"
          aria-label={playing || busy ? "Pause voice message" : `Play voice message, ${seconds} seconds`}
          aria-pressed={playing}
          onClick={() => {
            if (!url) setWanted(true);
            voicePlayback.toggle(key, url);
          }}
        >
          {busy ? <span className="spinner" aria-hidden="true" /> : playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <input
          type="range"
          className="voice-seek"
          min={0}
          max={Math.max(1, total)}
          value={Math.min(pos, Math.max(1, total))}
          aria-label="Position"
          aria-valuetext={`${Math.round(pos / 1000)} seconds of ${seconds} seconds`}
          disabled={!url}
          onChange={(e) => voicePlayback.seek(key, Number(e.target.value))}
        />
        <span className="voice-len">{playing || pos > 0 ? `${clock(pos)} / ${clock(total)}` : clock(total)}</span>
        {mine && playback.status !== "idle" && (
          <button className="voice-rate" onClick={() => voicePlayback.cycleRate()} aria-label={`Playback speed ${playback.rate} times. Change speed`}>
            {playback.rate}×
          </button>
        )}
        {mine && playback.failed && (
          <span className="voice-failed" role="alert">
            {playback.failed}
          </span>
        )}
      </div>
    </PreviewDownload>
  );
}

/**
 * A video: a tile with a play button that opens the viewer, where it decrypts and plays with Meldiq's controls; audio
 * files: a card until opened, then a player in place (decrypted in memory, never a page).
 */
export function MediaAttachment({ r, withDownload = false }: { r: AttachmentRef; withDownload?: boolean }) {
  const viewer = useViewer(r);
  const [open, setOpen] = useState(false);
  const { url, error, loading } = useBlobUrl(r, open);
  const [tile, tileNear] = useNearScreen<HTMLButtonElement>();
  const { autoLoadPhotos } = usePrefs();
  const { url: poster } = useBlobUrl(r.thumbnail ?? r, !!r.thumbnail && autoLoadPhotos && tileNear);
  if (error) return <FileAttachment r={r} error={error} />;
  if (isVideo(r))
    return (
      <PreviewDownload r={r} show={withDownload}>
        <button
          ref={tile}
          className="att-video-tile"
          onClick={(e) => {
            e.currentTarget.focus();
            viewer.open();
          }}
          aria-label={`Play video ${r.name}, ${bytes(r.size)}`}
        >
          {poster && <img className="att-video-poster" src={poster} alt="" loading="lazy" />}
          <span className="att-video-play" aria-hidden="true">
            <Play size={22} />
          </span>
          <span className="att-video-name">
            <Film size={14} aria-hidden="true" /> <span className="ellipsis">{r.name}</span>
            <small>{bytes(r.size)}</small>
          </span>
        </button>
        <button className="btn btn-ghost btn-sm" disabled={open && loading} onClick={() => setOpen(true)} aria-label={`Play ${r.name} inline`}>
          {open && loading ? "Loading video…" : "Play inline"}
        </button>
        {open && url && <video className="att-inline-video" src={url} controls playsInline autoPlay preload="metadata" aria-label={`Inline video ${r.name}`} />}
        {viewer.own}
      </PreviewDownload>
    );
  if (!open || loading || !url) {
    return (
      <PreviewDownload r={r} show={withDownload}>
        <button className="att-file" onClick={() => setOpen(true)} aria-label={`Play ${r.name}, ${bytes(r.size)}`} disabled={open}>
          <span className="file-icon">
            <Play size={18} />
          </span>
          <span className="grow" style={{ minWidth: 0 }}>
            <span className="ellipsis" style={{ display: "block", fontWeight: 600 }}>
              {r.name}
            </span>
            <small>{open ? "Loading…" : `${bytes(r.size)} · play here`}</small>
          </span>
        </button>
      </PreviewDownload>
    );
  }
  return (
    <PreviewDownload r={r} show={withDownload}>
      <audio className="att-audio" src={url} controls autoPlay aria-label={r.name} />
    </PreviewDownload>
  );
}

export function ImageAttachment({ r, withDownload = false }: { r: AttachmentRef; withDownload?: boolean }) {
  // Download photos automatically off (android Settings › Chats): each photo waits for a click.
  const { autoLoadPhotos } = usePrefs();
  const [asked, setAsked] = useState(false);
  const [decodeFailed, setDecodeFailed] = useState(false);
  // Loaded when scrolled near, not with the whole history (and then kept in this browser: src/store/mediaCache.ts).
  const [spot, near] = useNearScreen<HTMLDivElement>();
  const automatic = autoLoadPhotos && (r.thumbnail !== undefined || r.size <= 10 * 1024 * 1024);
  const { url, error, loading } = useBlobUrl(r.thumbnail ?? r, (automatic && near) || asked);
  const viewer = useViewer(r);
  if (error || decodeFailed) return <FileAttachment r={r} error={error ?? "This browser cannot preview this image. Download the original."} />;
  if (!automatic && !asked)
    return (
      <PreviewDownload r={r} show={withDownload}>
        <button className="att-file" onClick={() => setAsked(true)} aria-label={`Load photo ${r.name}, ${bytes(r.size)}`}>
          <span className="file-icon">
            <ImageIcon size={18} />
          </span>
          <span className="grow" style={{ minWidth: 0 }}>
            <span className="ellipsis" style={{ display: "block", fontWeight: 600 }}>
              Photo
            </span>
            <small>{bytes(r.size)} · click to load</small>
          </span>
        </button>
      </PreviewDownload>
    );
  return (
    <PreviewDownload r={r} show={withDownload}>
      {loading || !url ? (
        <div ref={spot} className="att-image att-pending skeleton" aria-label={`Loading ${r.name}`} />
      ) : (
        <button
          className="att-image"
          onClick={(e) => {
            e.currentTarget.focus();
            viewer.open();
          }}
          aria-label={`Open image ${r.name}`}
        >
          <img src={url} alt={r.name} loading="lazy" onError={() => setDecodeFailed(true)} />
        </button>
      )}
      {viewer.own}
    </PreviewDownload>
  );
}

/** Several photos sent together: up to four tiles, the last saying how many more; each opens a viewer that steps through all. */
function AlbumGrid({ items }: { items: AttachmentRef[] }) {
  const shared = useContext(OpenViewerContext);
  const [open, setOpen] = useState<number | null>(null);
  const more = albumOverflow(items.length);
  return (
    <div className="album" role="group" aria-label={`${items.length} photos`}>
      {albumRows(items.length).map((row, i) => (
        <div key={i} className="album-row">
          {row.map((at) => (
            <div className="album-entry" key={items[at].id} data-attachment-id={items[at].id}>
              <AlbumTile r={items[at]} more={at === 3 ? more : 0} onOpen={() => (shared ? shared(items[at]) : setOpen(at))} />
              <PreviewDownloadButton r={items[at]} />
            </div>
          ))}
        </div>
      ))}
      {open !== null && <MediaViewer items={items} at={open} onMove={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function AlbumTile({ r, more, onOpen }: { r: AttachmentRef; more: number; onOpen: () => void }) {
  const { autoLoadPhotos } = usePrefs();
  const [spot, near] = useNearScreen<HTMLButtonElement>();
  const { url, error } = useBlobUrl(r.thumbnail ?? r, autoLoadPhotos && near && (r.thumbnail !== undefined || r.size <= 10 * 1024 * 1024));
  return (
    <button
      ref={spot}
      className="album-tile"
      onClick={(e) => {
        e.currentTarget.focus();
        onOpen();
      }}
      aria-label={more ? `Open photos, ${more} more` : `Open image ${r.name}`}
    >
      {url ? (
        <img src={url} alt="" loading="lazy" />
      ) : error ? (
        <TriangleAlert size={18} />
      ) : autoLoadPhotos ? (
        <span className="skeleton" aria-hidden="true" />
      ) : (
        <ImageIcon size={20} aria-hidden="true" />
      )}
      {more > 0 && <span className="album-more">+{more}</span>}
    </button>
  );
}

function useAttachmentDownload(r: AttachmentRef, initialError?: string) {
  const engine = useEngine();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const abort = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  useEffect(() => () => abort.current?.abort(), []);
  const download = async () => {
    if (abort.current) return;
    const control = new AbortController();
    abort.current = control;
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      await saveAttachment(engine, r, {
        signal: control.signal,
        onProgress: setProgress,
      });
    } catch (e) {
      if (control.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) return;
      setError(e instanceof Error ? e.message : "Couldn't download this file. Try again.");
    } finally {
      abort.current = null;
      setBusy(false);
    }
  };
  return {
    busy,
    progress,
    error,
    download,
    cancel: () => abort.current?.abort(),
    percent: progress?.total ? Math.min(100, Math.floor((100 * progress.done) / progress.total)) : 0,
  };
}

function PreviewDownload({ r, show = true, children }: { r: AttachmentRef; show?: boolean; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <div className="attachment-preview">
      <div className="attachment-preview-content">{children}</div>
      <PreviewDownloadButton r={r} />
    </div>
  );
}

function PreviewDownloadButton({ r }: { r: AttachmentRef }) {
  const { busy, error, percent, download, cancel } = useAttachmentDownload(r);
  const name = attachmentName(r.name);
  const label = busy ? `Cancel downloading ${name}, ${percent}%` : `Download ${name}, ${bytes(r.size)}`;
  return (
    <div className="attachment-download-control">
      <button className="icon-btn attachment-download" type="button" onClick={busy ? cancel : () => void download()} aria-label={label} title={label}>
        {busy ? <X size={18} aria-hidden="true" /> : <Icon name="files.download" size={18} />}
      </button>
      {busy && <small aria-hidden="true">{percent}%</small>}
      {error && (
        <small role="alert" className="danger-text">
          {error}
        </small>
      )}
    </div>
  );
}

export function FileAttachment({ r, error: initialError }: { r: AttachmentRef; error?: string }) {
  const { busy, progress, error, download, cancel, percent } = useAttachmentDownload(r, initialError);
  const name = attachmentName(r.name);
  const extension = name.includes(".") ? name.split(".").pop()!.toUpperCase() : "FILE";
  return (
    <div className="att-file">
      <button className="file-download-name grow" onClick={() => void download()} disabled={busy} aria-label={`Download ${name}, ${bytes(r.size)}`}>
        <span className="file-icon">
          <Icon name="files.download" size={18} />
        </span>
        <span className="grow">
          <strong className="ellipsis">{r.voice ? "Voice message" : name}</strong>
          <small role={error ? "alert" : undefined}>
            {error ?? (busy ? (progress ? `${progress.phase === "decrypting" ? "Verifying" : "Downloading"} · ${percent}%` : "Starting download…") : `${extension} · ${bytes(r.size)}`)}
          </small>
          {busy && <progress max={100} value={percent} aria-label={`Download ${name}: ${percent}%`} />}
          {riskyAttachment(name) && <small>Open only if you trust the sender.</small>}
        </span>
      </button>
      {busy && (
        <button className="icon-btn attachment-download" onClick={cancel} aria-label={`Cancel downloading ${name}`}>
          <X size={18} />
        </button>
      )}
    </div>
  );
}
