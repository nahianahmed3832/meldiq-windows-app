import { useEffect, useRef, useState } from 'react';
import type { DesktopState, Preferences } from '../shared/contracts';
import { forgetAllMedia } from '../../packages/web/src/store/mediaCache';
export function DesktopSettings({ state, onChange, onClose }: { state: DesktopState; onChange: (s: DesktopState) => void; onClose: () => void }) {
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
    const enumerate = () => { void navigator.mediaDevices.enumerateDevices().then(setDevices, () => setDeviceError('Device access is unavailable. Messaging remains available.')); };
    enumerate(); navigator.mediaDevices.addEventListener('devicechange', enumerate);
    return () => { opened?.close(); navigator.mediaDevices.removeEventListener('devicechange', enumerate); clearTimeout(testTimer.current); stream.current?.getTracks().forEach(t => t.stop()); };
  }, []);
  const run = async (action: () => Promise<unknown>) => { setError(''); setNotice(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'The action failed.'); } };
  const patch = (p: Partial<Preferences>) => void run(async () => { onChange(await window.meldiqDesktop!.preferences(p)); if ('hardwareAcceleration' in p || 'cacheMB' in p) setNotice('This setting takes full effect after restarting Meldiq.'); });
  const stopTest = () => { clearTimeout(testTimer.current); stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (video.current) video.current.srcObject = null; setTesting(false); };
  const test = async (camera: boolean) => {
    stopTest();
    if (state.busy) throw new Error('Finish your call or transfers before testing devices.');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: !camera, video: camera });
      if (video.current && camera) { video.current.srcObject = stream.current; await video.current.play(); }
      stream.current.getTracks().forEach(track => track.addEventListener('ended', () => { setDeviceError('The device was disconnected. Choose another device in your call settings.'); stopTest(); }, { once: true }));
      setTesting(true); setDeviceError(''); setNotice(camera ? 'Camera preview is active for 10 seconds.' : 'Microphone detected. The test stops in 10 seconds.');
      testTimer.current = setTimeout(stopTest, 10_000);
    } catch (e) { stopTest(); throw e; }
  };
  return <dialog className="desktop-dialog" ref={dialog} onCancel={onClose} aria-labelledby="desktop-title">
    <header><h1 id="desktop-title">Desktop settings</h1><button className="icon-btn" onClick={onClose} aria-label="Close desktop settings">×</button></header>
    <div className="desktop-settings-body">
      <section><h2>Performance</h2><p>{state.profile.ramGB} GB RAM · {state.profile.logicalCpus} logical processors · {state.profile.mode} mode</p>
        <label>Performance mode<select aria-label="Performance mode" value={state.preferences.performance} onChange={e => patch({ performance: e.target.value as Preferences['performance'] })}><option value="auto">Automatic</option><option value="economy">Economy — fewer effects</option><option value="balanced">Balanced</option></select></label>
        <p className="faint">Basic messaging remains available on 4 GB devices. Automatic mode reduces effects on lower-memory or dual-core computers.</p>
        <label><input type="checkbox" checked={state.preferences.hardwareAcceleration} onChange={e => patch({ hardwareAcceleration: e.target.checked })} />Use hardware acceleration when available</label>
      </section>
      <section><h2>Temporary media cache</h2><p>{(state.cacheBytes / 1024 ** 2).toFixed(1)} MB used. Account data and encryption keys are kept separately.</p>
        <label>Cache budget<select value={state.preferences.cacheMB} onChange={e => patch({ cacheMB: Number(e.target.value) as Preferences['cacheMB'] })}>{[128,256,512].map(n => <option key={n} value={n}>{n} MB</option>)}</select></label>
        <button className="btn btn-secondary" disabled={state.busy} onClick={() => void run(async () => { await window.meldiqDesktop!.clearTemporaryCache(); await forgetAllMedia(); onChange(await window.meldiqDesktop!.state()); setNotice('Temporary media cleared. Your account data is preserved.'); })}>Clear temporary media cache</button>
      </section>
      <section><h2>Devices</h2><p>Choose your call devices in Meldiq Settings → Voice &amp; Audio.</p>
        {(['audioinput','videoinput','audiooutput'] as const).map(kind => <p key={kind}>{kind === 'audioinput' ? 'Microphones' : kind === 'videoinput' ? 'Cameras' : 'Audio outputs'}: {devices.filter(d => d.kind === kind).map(d => d.label || 'Available device (permission needed for name)').join(', ') || 'None detected'}</p>)}
        <div className="desktop-actions"><button className="btn btn-secondary" disabled={state.busy} onClick={() => void run(() => test(false))}>Test microphone</button><button className="btn btn-secondary" disabled={state.busy} onClick={() => void run(() => test(true))}>Test camera</button>{testing && <button className="btn" onClick={stopTest}>Stop test</button>}</div>
        <video ref={video} autoPlay muted playsInline hidden={!testing} className="desktop-device-preview" />{deviceError && <p role="status">{deviceError}</p>}
      </section>
      <section><h2>Desktop behavior</h2>
        <label><input type="checkbox" checked={state.preferences.closeToTray} onChange={e => patch({ closeToTray: e.target.checked })} />Keep Meldiq in the tray when its window closes</label>
        <label><input type="checkbox" checked={state.preferences.startAtLogin} onChange={e => patch({ startAtLogin: e.target.checked })} />Start Meldiq when I sign in to my computer</label>
        <label><input type="checkbox" checked={state.preferences.notifications} onChange={e => patch({ notifications: e.target.checked })} />Allow desktop notifications (account notification preferences still apply)</label>
      </section>
      <section><h2>Updates</h2>
        <label>Update preference<select value={state.preferences.updateMode} onChange={e => patch({ updateMode: e.target.value as Preferences['updateMode'] })}><option value="automatic">Automatic — install on safe exit</option><option value="ask">Download automatically, ask before restarting</option><option value="manual">Manual updates</option></select></label>
        <label>Channel<select value={state.preferences.channel} onChange={e => patch({ channel: e.target.value as Preferences['channel'] })}><option value="stable">Stable</option><option value="beta">Beta</option><option value="canary">Internal / canary</option></select></label>
        <p role="status">{state.update.message ?? state.update.status}{state.update.percent !== undefined && ` · ${state.update.percent.toFixed(0)}%`}</p>
        {state.update.status === 'downloading' && <progress value={state.update.percent ?? 0} max="100" />}
        <div className="desktop-actions"><button className="btn btn-secondary" disabled={state.update.status === 'disabled' || state.update.status === 'checking'} onClick={() => void run(() => window.meldiqDesktop!.update('check'))}>Check for updates</button>
        {state.update.status === 'available' && <button className="btn" onClick={() => void run(() => window.meldiqDesktop!.update('download'))}>Download update</button>}
        {state.update.status === 'downloaded' && <button className="btn btn-primary" disabled={state.busy} onClick={() => void run(() => window.meldiqDesktop!.update('install'))}>Restart and install</button>}</div>
        {state.busy && <p>Calls or transfers are active. Restart and cache clearing will wait.</p>}
      </section>
      <section><h2>About Meldiq</h2><p>Version {state.build.version} · {state.build.channel} · {state.build.distribution}</p><p className="desktop-build">Commit {state.build.commit}<br />Built {state.build.timestamp}</p></section>
      {error && <p role="alert" className="desktop-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    </div>
  </dialog>;
}
