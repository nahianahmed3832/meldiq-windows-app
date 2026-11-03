import { useT } from '../../packages/web/src/i18n';
import { useEffect, useRef, useState } from 'react';
import type { DesktopState, Preferences } from '../shared/contracts';
import { forgetAllMedia } from '../../packages/web/src/store/mediaCache';
export function DesktopSettings({ state, onChange, onClose }: {
    state: DesktopState;
    onChange: (s: DesktopState) => void;
    onClose: () => void;
}) {
    const t = useT();
    const dialog = useRef<HTMLDialogElement>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceError, setDeviceError] = useState('');
    const [testing, setTesting] = useState(false);
    const stream = useRef<MediaStream | null>(null);
    const testTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const video = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const opened = dialog.current;
        opened?.showModal();
        const enumerate = () => { void navigator.mediaDevices.enumerateDevices().then(setDevices, () => setDeviceError(t("desktop_device_access_is_unavailable_messaging_remains_available"))); };
        enumerate();
        navigator.mediaDevices.addEventListener('devicechange', enumerate);
        return () => { opened?.close(); navigator.mediaDevices.removeEventListener('devicechange', enumerate); clearTimeout(testTimer.current); stream.current?.getTracks().forEach(t => t.stop()); };
    }, []);
    const run = async (action: () => Promise<unknown>) => { setError(''); setNotice(''); try {
        await action();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : t("desktop_the_action_failed"));
    } };
    const patch = (p: Partial<Preferences>) => void run(async () => { onChange(await window.meldiqDesktop!.preferences(p)); if ('hardwareAcceleration' in p || 'cacheMB' in p)
        setNotice(t("desktop_this_setting_takes_full_effect_after_restarting_meldiq")); });
    const stopTest = () => { clearTimeout(testTimer.current); stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (video.current)
        video.current.srcObject = null; setTesting(false); };
    const test = async (camera: boolean) => {
        stopTest();
        if (state.busy)
            throw new Error(t("desktop_finish_your_call_or_transfers_before_testing_devices"));
        try {
            stream.current = await navigator.mediaDevices.getUserMedia({ audio: !camera, video: camera });
            if (video.current && camera) {
                video.current.srcObject = stream.current;
                await video.current.play();
            }
            stream.current.getTracks().forEach(track => track.addEventListener('ended', () => { setDeviceError(t("desktop_the_device_was_disconnected_choose_another_device_in_your_call_s")); stopTest(); }, { once: true }));
            setTesting(true);
            setDeviceError('');
            setNotice(camera ? t("desktop_camera_preview_is_active_for_10_seconds") : t("desktop_microphone_detected_the_test_stops_in_10_seconds"));
            testTimer.current = setTimeout(stopTest, 10000);
        }
        catch (e) {
            stopTest();
            throw e;
        }
    };
    return <dialog className="desktop-dialog" ref={dialog} onCancel={onClose} aria-labelledby="desktop-title">
    <header><h1 id="desktop-title">{t("desktop_desktop_settings")}</h1><button className="icon-btn" onClick={onClose} aria-label={t("desktop_close_desktop_settings")}>×</button></header>
    <div className="desktop-settings-body">
      <section><h2>{t("desktop_performance")}</h2><p>{state.profile.ramGB}{t("desktop_gb_ram")} {state.profile.logicalCpus}{t("desktop_logical_processors")} {state.profile.mode}{t("desktop_mode")}</p>
        <label>{t("desktop_performance_mode")}<select aria-label={t("desktop_performance_mode")} value={state.preferences.performance} onChange={e => patch({ performance: e.target.value as Preferences['performance'] })}><option value="auto">{t("desktop_automatic")}</option><option value="economy">{t("desktop_economy_fewer_effects")}</option><option value="balanced">{t("desktop_balanced")}</option></select></label>
        <p className="faint">{t("desktop_basic_messaging_remains_available_on_4_gb_devices_automatic_mode")}</p>
        <label><input type="checkbox" checked={state.preferences.hardwareAcceleration} onChange={e => patch({ hardwareAcceleration: e.target.checked })}/>{t("desktop_use_hardware_acceleration_when_available")}</label>
      </section>
      <section><h2>{t("desktop_temporary_media_cache")}</h2><p>{(state.cacheBytes / 1024 ** 2).toFixed(1)}{t("desktop_mb_used_account_data_and_encryption_keys_are_kept_separately")}</p>
        <label>{t("desktop_cache_budget")}<select value={state.preferences.cacheMB} onChange={e => patch({ cacheMB: Number(e.target.value) as Preferences['cacheMB'] })}>{[128, 256, 512].map(n => <option key={n} value={n}>{n}{t("desktop_mb")}</option>)}</select></label>
        <button className="btn btn-secondary" disabled={state.busy} onClick={() => void run(async () => { await window.meldiqDesktop!.clearTemporaryCache(); await forgetAllMedia(); onChange(await window.meldiqDesktop!.state()); setNotice(t("desktop_temporary_media_cleared_your_account_data_is_preserved")); })}>{t("desktop_clear_temporary_media_cache")}</button>
      </section>
      <section><h2>{t("desktop_browser_callbacks")}</h2>
        <p>{state.protocolRegistered ? t("desktop_meldiq_is_registered_to_receive_browser_callbacks") : t("desktop_callback_registration_is_unavailable_reinstall_meldiq_for_your_w")}</p>
        <p>{state.browserHandoff ? t("desktop_browser_handoff_is_available_for_sign_in_and_discord") : t("desktop_the_hosted_browser_handoff_has_not_been_deployed_direct_social_s")}</p>
      </section>
      <section><h2>{t("desktop_device_permissions")}</h2>
        <p>{t("desktop_windows_privacy_settings_also_control_access_resetting_affects_f")}</p>
        <p>{['microphone', 'camera', 'speakers'].map(key => `${key}: ${state.permissions[key as keyof typeof state.permissions] === undefined ? t("desktop_ask_when_needed") : state.permissions[key as keyof typeof state.permissions] ? t("desktop_allowed") : t("desktop_blocked")}`).join(' · ')}</p>
        <button className="btn btn-secondary" disabled={state.busy} onClick={() => void run(async () => { onChange(await window.meldiqDesktop!.resetPermissions()); setNotice(t("desktop_device_permissions_reset_meldiq_will_ask_when_a_device_is_next_u")); })}>{t("desktop_reset_device_permissions")}</button>
      </section>
      <section><h2>{t("desktop_devices")}</h2><p>{t("desktop_choose_your_call_devices_in_meldiq_settings_voice_amp_audio")}</p>
        {(['audioinput', 'videoinput', 'audiooutput'] as const).map(kind => <p key={kind}>{kind === 'audioinput' ? t("desktop_microphones") : kind === 'videoinput' ? t("desktop_cameras") : t("desktop_audio_outputs")}{': '}{devices.filter(d => d.kind === kind).map(d => d.label || t('desktop_available_device')).join(', ') || t('desktop_none_detected')}</p>)}
        <div className="desktop-actions"><button className="btn btn-secondary" disabled={state.busy} onClick={() => void run(() => test(false))}>{t("desktop_test_microphone")}</button><button className="btn btn-secondary" disabled={state.busy} onClick={() => void run(() => test(true))}>{t("desktop_test_camera")}</button>{testing && <button className="btn" onClick={stopTest}>{t("desktop_stop_test")}</button>}</div>
        <video ref={video} autoPlay muted playsInline hidden={!testing} className="desktop-device-preview"/>{deviceError && <p role="status">{deviceError}</p>}
      </section>
      <section><h2>{t("desktop_desktop_behavior")}</h2>
        <label><input type="checkbox" checked={state.preferences.closeToTray} onChange={e => patch({ closeToTray: e.target.checked })}/>{t("desktop_keep_meldiq_in_the_tray_when_its_window_closes")}</label>
        <label><input type="checkbox" checked={state.preferences.startAtLogin} onChange={e => patch({ startAtLogin: e.target.checked })}/>{t("desktop_start_meldiq_when_i_sign_in_to_my_computer")}</label>
        <label><input type="checkbox" checked={state.preferences.notifications} onChange={e => patch({ notifications: e.target.checked })}/>{t("desktop_allow_desktop_notifications_account_notification_preferences_sti")}</label>
      </section>
      <section><h2>{t("desktop_updates")}</h2>
        <label>{t("desktop_update_preference")}<select value={state.preferences.updateMode} onChange={e => patch({ updateMode: e.target.value as Preferences['updateMode'] })}><option value="automatic">{t("desktop_automatic_install_on_safe_exit")}</option><option value="ask">{t("desktop_download_automatically_ask_before_restarting")}</option><option value="manual">{t("desktop_manual_updates")}</option></select></label>
        <label>{t("desktop_channel")}<select value={state.preferences.channel} onChange={e => patch({ channel: e.target.value as Preferences['channel'] })}><option value="stable">{t("desktop_stable")}</option><option value="beta">{t("desktop_beta")}</option><option value="canary">{t("desktop_internal_canary")}</option></select></label>
        <p role="status">{state.update.message ?? state.update.status}{state.update.percent !== undefined && ` · ${state.update.percent.toFixed(0)}%`}</p>
        {state.update.status === 'downloading' && <progress value={state.update.percent ?? 0} max="100"/>}
        <div className="desktop-actions"><button className="btn btn-secondary" disabled={state.update.status === 'disabled' || state.update.status === 'checking'} onClick={() => void run(() => window.meldiqDesktop!.update('check'))}>{t("desktop_check_for_updates")}</button>
        {state.update.status === 'available' && <button className="btn" onClick={() => void run(() => window.meldiqDesktop!.update('download'))}>{t("desktop_download_update")}</button>}
        {state.update.status === 'downloaded' && <button className="btn btn-primary" disabled={state.busy} onClick={() => void run(() => window.meldiqDesktop!.update('install'))}>{t("desktop_restart_and_install")}</button>}</div>
        {state.busy && <p>{t("desktop_calls_or_transfers_are_active_restart_and_cache_clearing_will_wa")}</p>}
      </section>
      <section><h2>{t("desktop_about_meldiq")}</h2><p>{t("desktop_version")} {state.build.version}{' · '}{state.build.channel}{' · '}{state.build.distribution}</p><p className="desktop-build">{t("desktop_commit")} {state.build.commit}<br />{t("desktop_built")} {state.build.timestamp}</p></section>
      {error && <p role="alert" className="desktop-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    </div>
  </dialog>;
}
