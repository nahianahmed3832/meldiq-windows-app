import { useEffect, useState } from 'react';
import type { CaptureSource } from '../shared/contracts';
export function CapturePicker() {
  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [selected, select] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void window.meldiqDesktop!.captureSources().then(setSources, () => setError('No screens or windows are available.')); }, []);
  return <main className="capture-picker"><h1>Share your screen</h1><p>Choose a display or window. Everyone in the call can see what you share.</p>
    <div className="capture-grid" role="group" aria-label="Screens and windows">{sources.map(s => <button key={s.id} aria-pressed={selected === s.id} onClick={() => select(s.id)}><img src={s.thumbnail} alt="" /><span>{s.name}</span>{s.displayId && <small>Display {s.displayId}</small>}</button>)}</div>
    {error && <p role="alert">{error}</p>}<footer><button className="btn btn-secondary" onClick={() => void window.meldiqDesktop!.chooseCapture(null)}>Cancel</button><button className="btn btn-primary" disabled={!selected} onClick={() => void window.meldiqDesktop!.chooseCapture(selected)}>Share selected</button></footer>
  </main>;
}
