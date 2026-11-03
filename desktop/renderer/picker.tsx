import { useT } from '../../packages/web/src/i18n';
import { useEffect, useState } from 'react';
import type { CaptureSource } from '../shared/contracts';
export function CapturePicker() {
    const t = useT();
    const [sources, setSources] = useState<CaptureSource[]>([]);
    const [selected, select] = useState<string | null>(null);
    const [error, setError] = useState('');
    useEffect(() => { void window.meldiqDesktop!.captureSources().then(setSources, () => setError(t("desktop_no_screens_or_windows_are_available"))); }, []);
    return <main className="capture-picker"><h1>{t("desktop_share_your_screen")}</h1><p>{t("desktop_choose_a_display_or_window_everyone_in_the_call_can_see_what_you")}</p>
    <div className="capture-grid" role="group" aria-label={t("desktop_screens_and_windows")}>{sources.map(s => <button key={s.id} aria-pressed={selected === s.id} onClick={() => select(s.id)}><img src={s.thumbnail} alt=""/><span>{s.name}</span>{s.displayId && <small>{t("desktop_display", { id: s.displayId })}</small>}</button>)}</div>
    {error && <p role="alert">{error}</p>}<footer><button className="btn btn-secondary" onClick={() => void window.meldiqDesktop!.chooseCapture(null)}>{t("desktop_cancel")}</button><button className="btn btn-primary" disabled={!selected} onClick={() => void window.meldiqDesktop!.chooseCapture(selected)}>{t("desktop_share_selected")}</button></footer>
  </main>;
}
