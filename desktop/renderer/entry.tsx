import { setSystemLanguages, useT } from '../../packages/web/src/i18n';
import '../../packages/web/src/application/validationPolicy';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { App } from '../../packages/web/src/ui/App';
import { applyTheme, getPrefs } from '../../packages/web/src/application/prefs';
import { startConfig } from '../../packages/web/src/application/config';
import { startRouting, go } from '../../packages/web/src/application/router';
import { installLegacyCurves } from '../../packages/web/src/crypto/legacyCurves';
import { capturePendingInvite, capturePendingMessage, capturePendingTemplate, captureReferral } from '../../packages/web/src/application/pendingInvite';
import { followVisualViewport } from '../../packages/web/src/application/viewport';
import { DesktopSettings } from './settings';
import { CapturePicker } from './picker';
import type { DesktopState } from '../shared/contracts';
import './web-styles.css';
import './desktop.css';
function DesktopApp() {
    const t = useT();
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState(false);
    const [desktop, setDesktop] = useState<DesktopState | null>(null);
    useEffect(() => {
        const bridge = window.meldiqDesktop;
        if (!bridge) {
            setError(t("desktop_open_meldiq_through_the_installed_desktop_application"));
            return;
        }
        applyTheme(getPrefs());
        const stopViewport = followVisualViewport();
        capturePendingInvite();
        capturePendingMessage();
        capturePendingTemplate();
        captureReferral();
        const stopRouting = startRouting();
        const updateState = (state: DesktopState) => {
            setSystemLanguages(state.systemLanguages);
            applyTheme(getPrefs());
            setDesktop(state);
            document.documentElement.dataset.performance = state.profile.mode;
        };
        const stopState = bridge.onState(updateState);
        const stopSettings = bridge.onSettings(() => setSettings(true));
        const stopNavigation = bridge.onNavigate(href => {
            if (href === '__resume')
                window.dispatchEvent(new Event('online'));
            else if (href.startsWith('/')) {
                go(href);
                capturePendingInvite();
                capturePendingMessage();
                capturePendingTemplate();
                captureReferral();
                window.dispatchEvent(new Event('meldiq:route'));
                window.dispatchEvent(new Event('meldiq:desktop-pending-link'));
            }
        });
        void Promise.all([startConfig(), installLegacyCurves(), bridge.state().then(updateState)]).then(() => { setReady(true); void bridge.setBusy(false); }, e => setError(e instanceof Error ? e.message : t("desktop_meldiq_could_not_start")));
        const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            setSettings(true);
        } };
        window.addEventListener('keydown', key);
        return () => { stopViewport(); stopRouting(); stopState(); stopSettings(); stopNavigation(); window.removeEventListener('keydown', key); };
    }, []);
    return <>
    {desktop?.isolatedTest && <div className="desktop-qa-banner" role="status">{`Meldiq — ${t("desktop_local_test")}`}</div>}
    {error ? <main className="desktop-launch"><h1>{t("desktop_meldiq_could_not_start_2")}</h1><p>{error}</p><button className="btn" onClick={() => location.reload()}>{t("desktop_try_again")}</button></main>
            : ready ? <App /> : <div className="desktop-launch" role="status"><img src="/meldling-96.webp" width="64" height="64" alt=""/><p>{t("desktop_opening_meldiq")}</p></div>}
    <button className="desktop-settings-launch" onClick={() => setSettings(true)} title={t("desktop_desktop_settings_ctrl")} aria-label={t("desktop_desktop_settings")}>⚙</button>
    {desktop?.update.status === 'downloaded' && !settings && <button className="desktop-update-toast btn" onClick={() => setSettings(true)}>{t("desktop_meldiq_update_ready")}</button>}
    {settings && desktop && <DesktopSettings state={desktop} onChange={setDesktop} onClose={() => setSettings(false)}/>}
  </>;
}
createRoot(document.getElementById('desktop-root')!).render(location.pathname === '/capture-picker' ? <CapturePicker /> : <DesktopApp />);
