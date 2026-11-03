import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, shell, dialog, session, safeStorage, Notification, desktopCapturer, screen, powerMonitor, autoUpdater as nativeUpdater } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PreferenceStore } from './preferences';
import { installProtocol } from './protocol';
import { Updates } from './updater';
import { ORIGIN, isLocalPage, isAppPath, externalUrl, parseDeepLink, performanceProfile, validateTokens } from '../shared/policy';
import type { BuildInfo, CaptureSource, DesktopState } from '../shared/contracts';

const appRoot = app.getAppPath();
const build: BuildInfo = JSON.parse(fs.readFileSync(path.join(appRoot, 'dist/build-info.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(appRoot, 'dist/runtime-config.json'), 'utf8'));
// Entire qualification blocks are removed from public binaries by esbuild dropLabels.
// eslint-disable-next-line no-unused-labels
UPDATER_LAB: {
  const controlPath = process.env.MELDIQ_UPDATE_LAB_CONTROL || path.join(app.getPath('appData'), 'Meldiq Update Lab', 'control-' + config.updateLabId + '.json');
  const control = JSON.parse(fs.readFileSync(controlPath, 'utf8'));
  if (!build.updateLab || !path.isAbsolute(control.profile) || !path.isAbsolute(control.report)) throw new Error('Invalid isolated updater lab configuration');
  app.setName('Meldiq Update Lab');
  app.setPath('userData', control.profile);
  config.updateOrigin += '/' + control.scenario;
  config.updateAppId = 'app.meldiq.desktop.update-lab';
  config.updateLabControl = control;
}
const testApi = !app.isPackaged && process.env.MELDIQ_TEST_USER_DATA && process.env.MELDIQ_TEST_API_ORIGIN;
if (testApi) {
  const url = new URL(testApi);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('Test backend must be an isolated loopback origin');
  config.apiOrigin = url.origin; config.websocketUrl = `${url.origin.replace('http:', 'ws:')}/v1/ws`;
}
if (config.origin !== ORIGIN || !testApi && (new URL(config.apiOrigin).protocol !== 'https:' || new URL(config.websocketUrl).protocol !== 'wss:')) throw new Error('Invalid packaged network configuration');
app.setName('Meldiq');
// Tests use their own temporary profile; packaged builds never accept environment profile overrides.
if (!app.isPackaged && process.env.MELDIQ_TEST_USER_DATA) app.setPath('userData', path.resolve(process.env.MELDIQ_TEST_USER_DATA));
const prefs = new PreferenceStore(path.join(app.getPath('userData'), 'desktop-preferences.json'));
// eslint-disable-next-line no-unused-labels
UPDATER_LAB: { prefs.patch({ updateMode: config.updateLabControl.scenario === 'upgrade' ? 'automatic' : 'manual', closeToTray: false }); }
if (!prefs.value.hardwareAcceleration) app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disk-cache-size', String(prefs.value.cacheMB * 1024 ** 2));
const single = app.requestSingleInstanceLock();
let main: BrowserWindow | null = null;
let tray: Tray | null = null;
let picker: BrowserWindow | null = null;
let paymentWindow: BrowserWindow | null = null;
let quitting = false;
let rendererBusy = true;
let downloads = 0;
let capturePending = false;
let cacheBytes = 0;
let updates: Updates;
let sources: Electron.DesktopCapturerSource[] = [];
let chooseCapture: ((id: string | null) => void) | null = null;
const grants = new Set<string>();
const notices = new Map<string, Notification>();
const pendingNavigation: string[] = [];
const social = new Map<string, { resolve: (r: { id: string; receipt: string }) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
const busy = () => rendererBusy || downloads > 0 || capturePending || paymentWindow !== null;
function state(): DesktopState {
  return { preferences: prefs.value, profile: performanceProfile(os.totalmem(), os.cpus().length, prefs.value), build, update: updates?.state ?? { status: 'disabled' }, busy: busy(), cacheBytes };
}
function emitState() { if (main && !main.isDestroyed()) main.webContents.send('desktop:state-changed', state()); }
function show() { if (main?.isMinimized()) main.restore(); main?.show(); main?.focus(); }
function navigate(href: string) {
  if (!isAppPath(href)) return;
  if (!main || main.webContents.isLoadingMainFrame()) pendingNavigation.push(href);
  else main.webContents.send('desktop:navigate', href);
  show();
}
function deepLink(raw: string) {
  const link = parseDeepLink(raw);
  if (!link) return;
  if (link.kind === 'navigate') return navigate(link.href);
  const pending = social.get(link.id);
  if (!pending) return; // Unsolicited/replayed callbacks never establish sessions.
  clearTimeout(pending.timer); social.delete(link.id);
  if (link.receipt) pending.resolve({ id: link.id, receipt: link.receipt });
  else pending.reject(new Error(link.error === 'cancelled' ? 'Sign-in cancelled.' : 'Provider verification failed.'));
  show();
}
function trusted(event: Electron.IpcMainInvokeEvent, role: 'main' | 'picker' = 'main') {
  const target = role === 'main' ? main : picker;
  if (!target || event.sender !== target.webContents || event.senderFrame !== target.webContents.mainFrame) throw new Error('Untrusted IPC sender');
  if (role === 'main' ? !isLocalPage(event.senderFrame.url) : event.senderFrame.url !== `${ORIGIN}/capture-picker`) throw new Error('Untrusted IPC document');
}
function handle(name: string, fn: (payload: unknown) => unknown, role: 'main' | 'picker' = 'main') {
  ipcMain.handle(`desktop:${name}`, (event, payload) => { trusted(event, role); return fn(payload); });
}
async function external(raw: unknown, confirm = true) {
  const url = externalUrl(raw);
  if (!url || !main) throw new Error('Only valid HTTPS links can open outside Meldiq.');
  const u = new URL(url);
  const own = ['meldiq.app', 'www.meldiq.app', 'web.meldiq.app'].includes(u.hostname);
  if (!own && confirm) {
    const answer = await dialog.showMessageBox(main, { type: 'question', message: `Open ${u.hostname} in your browser?`, detail: url, buttons: ['Cancel', 'Open browser'], defaultId: 0, cancelId: 0, noLink: true });
    if (answer.response !== 1) return;
  }
  await shell.openExternal(url);
}
function installIpc(ses: Electron.Session) {
  handle('state', async () => { cacheBytes = await ses.getCacheSize(); return state(); });
  handle('preferences', input => {
    const previous = prefs.value;
    // Refuse before persisting; an in-flight old-channel installer must never reappear under a new channel.
    if (input && typeof input === 'object' && 'channel' in input && input.channel !== previous.channel) updates.assertCanConfigure();
    prefs.patch(input);
    if (previous.startAtLogin !== prefs.value.startAtLogin && ['win32', 'darwin'].includes(process.platform)) app.setLoginItemSettings({ openAtLogin: prefs.value.startAtLogin, path: process.execPath });
    if (previous.channel !== prefs.value.channel) updates.configure();
    emitState(); return state();
  });
  handle('busy', value => { if (typeof value !== 'boolean') throw new Error('Invalid operation state'); rendererBusy = value; emitState(); });
  handle('clear-cache', async () => {
    if (busy()) throw new Error('Finish calls and transfers before clearing temporary media.');
    await ses.clearCache();
    // Deliberately never clearStorageData: IndexedDB/localStorage contain accounts and E2EE keys.
    cacheBytes = await ses.getCacheSize(); emitState();
  });
  handle('external', raw => external(raw));
  handle('update', action => updates.action(action));
  handle('seal', raw => {
    if (!safeStorage.isEncryptionAvailable() || process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text') throw new Error('OS secure storage is unavailable. Enable your system credential store and try again.');
    return safeStorage.encryptString(JSON.stringify(validateTokens(raw))).toString('base64');
  });
  handle('unseal', raw => {
    if (typeof raw !== 'string' || raw.length > 100_000 || !/^[A-Za-z0-9+/]+=*$/.test(raw)) throw new Error('Invalid sealed session');
    return validateTokens(JSON.parse(safeStorage.decryptString(Buffer.from(raw, 'base64'))));
  });
  handle('notify', raw => {
    if (!prefs.value.notifications || !Notification.isSupported() || !raw || typeof raw !== 'object') return;
    const n = raw as Record<string, unknown>;
    if (typeof n.title !== 'string' || n.title.length > 200 || typeof n.body !== 'string' || n.body.length > 2000 || typeof n.tag !== 'string' || n.tag.length > 300 || n.silent !== undefined && typeof n.silent !== 'boolean' || n.href !== null && (typeof n.href !== 'string' || !isAppPath(n.href))) throw new Error('Invalid notification');
    notices.get(n.tag)?.close();
    if (notices.size >= 30) { const first = notices.keys().next().value!; notices.get(first)?.close(); notices.delete(first); }
    const shown = new Notification({ title: n.title, body: n.body, silent: n.silent === true, icon: path.join(appRoot, 'desktop/resources/icon.png') });
    notices.set(n.tag, shown);
    shown.on('click', () => { if (typeof n.href === 'string') navigate(n.href); else show(); });
    shown.on('close', () => { if (notices.get(n.tag as string) === shown) notices.delete(n.tag as string); });
    shown.show();
  });
  handle('social', raw => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid sign-in flow');
    const flow = raw as { id: string; url: string; expiresAt: number };
    if (typeof flow.id !== 'string' || !/^[\w-]{43}$/.test(flow.id) || flow.url !== `${config.apiOrigin}/v2/auth/social/authorize/${flow.id}` || !Number.isFinite(flow.expiresAt) || flow.expiresAt <= Date.now() || flow.expiresAt > Date.now() + 15 * 60_000 || social.has(flow.id) || social.size > 2) throw new Error('Invalid sign-in authorization');
    return new Promise<{ id: string; receipt: string }>((resolve, reject) => {
      const timer = setTimeout(() => { social.delete(flow.id); reject(new Error('Sign-in expired. Try again.')); }, flow.expiresAt - Date.now());
      social.set(flow.id, { resolve, reject, timer });
      void external(flow.url, false).catch(() => { clearTimeout(timer); social.delete(flow.id); reject(new Error('Unable to open your browser.')); });
    });
  });
  handle('cancel-social', id => { if (typeof id !== 'string') return; const pending = social.get(id); if (pending) { clearTimeout(pending.timer); pending.reject(new Error('Sign-in cancelled.')); social.delete(id); } });
  handle('capture-sources', (): CaptureSource[] => sources.map(s => ({ id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL(), displayId: s.display_id })), 'picker');
  handle('capture-choose', id => { if (id !== null && (typeof id !== 'string' || !sources.some(s => s.id === id))) throw new Error('Invalid capture source'); chooseCapture?.(id as string | null); }, 'picker');
}
function secureWindow(win: BrowserWindow, isPicker = false) {
  const wc = win.webContents;
  wc.on('will-attach-webview', event => event.preventDefault());
  const paymentUrl = (url: string) => {
    if (url === 'about:blank') return true;
    try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password && !u.port && ['www.paypal.com', 'www.sandbox.paypal.com'].includes(u.hostname); } catch { return false; }
  };
  wc.setWindowOpenHandler(({ url }) => {
    const checkout = !isPicker && /^\/settings\/(checkout|billing|mojo|spark)$/.test(new URL(wc.getURL()).pathname);
    if (checkout && !paymentWindow && paymentUrl(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 520, height: 760, autoHideMenuBar: true, parent: win, webPreferences: { session: session.fromPartition('persist:meldiq-payments'), preload: path.join(appRoot, 'dist/main/payment-preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, webviewTag: false } } };
    void external(url).catch(() => undefined); return { action: 'deny' };
  });
  wc.on('did-create-window', child => {
    paymentWindow = child; emitState();
    child.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    child.webContents.on('will-attach-webview', event => event.preventDefault());
    child.webContents.on('will-navigate', (event, url) => { if (!paymentUrl(url)) event.preventDefault(); });
    child.webContents.on('will-redirect', (event, url) => { if (!paymentUrl(url)) event.preventDefault(); });
    child.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    child.webContents.session.setPermissionCheckHandler(() => false);
    child.on('closed', () => { if (paymentWindow === child) paymentWindow = null; emitState(); });
  });
  wc.on('will-navigate', (event, url) => {
    if (isPicker ? url === `${ORIGIN}/capture-picker` : isLocalPage(url)) return;
    event.preventDefault(); void external(url).catch(() => undefined);
  });
  wc.on('will-redirect', (event, url) => { if (!isLocalPage(url)) event.preventDefault(); });
  wc.on('will-frame-navigate', (event) => {
    if (event.isMainFrame) return;
    try { const u = new URL(event.url); if (u.protocol === 'https:' && (u.hostname === 'www.youtube-nocookie.com' || u.hostname === 'www.paypal.com' || u.hostname.endsWith('.paypal.com'))) return; } catch { /* denied */ }
    event.preventDefault();
  });
  if (!isPicker) {
    wc.on('did-start-navigation', (_e, _url, _inPlace, isMain) => { if (isMain && !_inPlace) { rendererBusy = true; emitState(); } });
    wc.on('render-process-gone', () => { rendererBusy = true; emitState(); });
    wc.on('did-finish-load', () => { pendingNavigation.splice(0).forEach(href => navigate(href)); });
  }
}
function permissions(ses: Electron.Session) {
  ses.setPermissionCheckHandler((wc, permission, origin) => wc === main?.webContents && origin === ORIGIN && (Boolean(testApi) && ['local-network', 'local-network-access', 'loopback-network'].includes(permission) || permission === 'media' || permission === 'display-capture' || permission === 'speaker-selection' || permission === 'notifications' && prefs.value.notifications));
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    if (wc !== main?.webContents || !isLocalPage(wc.getURL()) || !details.isMainFrame) return callback(false);
    if (testApi && ['local-network', 'local-network-access', 'loopback-network'].includes(permission)) return callback(true);
    if (!['media', 'notifications', 'speaker-selection', 'display-capture'].includes(permission)) return callback(false);
    if (permission === 'notifications') return callback(prefs.value.notifications);
    if (permission === 'display-capture') return callback(true); // Actual source selection is mandatory below.
    const key = permission + ('mediaTypes' in details ? JSON.stringify(details.mediaTypes) : '');
    if (grants.has(key)) return callback(true);
    void dialog.showMessageBox(main!, { type: 'question', message: permission === 'media' ? `Allow Meldiq to use ${'mediaTypes' in details ? details.mediaTypes?.join(' and ') ?? 'your microphone and camera' : 'your microphone and camera'}?` : 'Allow Meldiq to select an audio output?', buttons: ['Do not allow', 'Allow this session'], defaultId: 0, cancelId: 0, noLink: true }).then(({ response }) => { if (response === 1) grants.add(key); callback(response === 1); }, () => callback(false));
  });
  ses.setDisplayMediaRequestHandler(async (request, callback) => {
    if (!main || request.frame !== main.webContents.mainFrame || !isLocalPage(request.frame.url) || !request.userGesture || capturePending) return callback({});
    capturePending = true; emitState();
    try {
      sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 240, height: 135 }, fetchWindowIcons: false });
      sources = sources.filter(s => s.name !== 'Meldiq — Share your screen');
      if (!sources.length) { capturePending = false; emitState(); return callback({}); }
      picker = new BrowserWindow({ title: 'Meldiq — Share your screen', width: 780, height: 580, parent: main, modal: true, autoHideMenuBar: true, webPreferences: { session: ses, preload: path.join(appRoot, 'dist/main/preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false, webviewTag: false } });
      secureWindow(picker, true);
      let finished = false;
      const timeout = setTimeout(() => finish(null), 60_000);
      const finish = (id: string | null) => {
        if (finished) return; finished = true; clearTimeout(timeout);
        const selected = sources.find(s => s.id === id);
        chooseCapture = null; sources = []; capturePending = false;
        callback(selected ? { video: selected, ...(request.audioRequested && process.platform === 'win32' ? { audio: 'loopback' as const } : {}) } : {});
        picker?.close(); picker = null; emitState();
      };
      chooseCapture = finish;
      picker.on('closed', () => finish(null));
      await picker.loadURL(`${ORIGIN}/capture-picker`);
    } catch {
      if (chooseCapture) chooseCapture(null);
      else { picker?.destroy(); picker = null; sources = []; capturePending = false; callback({}); emitState(); }
    }
  }, { useSystemPicker: false });
}
function makeWindow(ses: Electron.Session) {
  const work = screen.getPrimaryDisplay().workArea;
  let bounds: Partial<Electron.Rectangle> = { width: Math.min(1320, work.width), height: Math.min(860, work.height) };
  try { const b = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'window.json'), 'utf8')); if ([b.width, b.height, b.x, b.y].every(Number.isFinite) && screen.getAllDisplays().some(d => b.x >= d.workArea.x && b.y >= d.workArea.y && b.x < d.workArea.x + d.workArea.width - 100 && b.y < d.workArea.y + d.workArea.height - 100)) bounds = { x: b.x, y: b.y, width: Math.max(960, Math.min(b.width, work.width)), height: Math.max(600, Math.min(b.height, work.height)) }; } catch { /* defaults */ }
  main = new BrowserWindow({ ...bounds, minWidth: 960, minHeight: 600, title: 'Meldiq', backgroundColor: '#1e1f22', show: false, icon: path.join(appRoot, 'desktop/resources/icon.png'), webPreferences: { session: ses, preload: path.join(appRoot, 'dist/main/preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, webviewTag: false, spellcheck: true, backgroundThrottling: true } });
  secureWindow(main);
  main.once('ready-to-show', show);
  main.on('close', event => {
    if (!quitting && prefs.value.closeToTray && tray) { event.preventDefault(); main?.hide(); return; }
    if (!quitting && busy()) { event.preventDefault(); void dialog.showMessageBox(main!, { type: 'info', message: 'Finish your call, screen sharing and transfers before quitting Meldiq.', buttons: ['Keep Meldiq open'] }); }
  });
  main.on('closed', () => { main = null; });
  let boundsTimer: ReturnType<typeof setTimeout>;
  const saveBounds = () => { clearTimeout(boundsTimer); boundsTimer = setTimeout(() => { if (main && !main.isMaximized() && !main.isMinimized()) fs.writeFileSync(path.join(app.getPath('userData'), 'window.json'), JSON.stringify(main.getBounds())); }, 500); };
  main.on('resize', saveBounds); main.on('move', saveBounds);
  void main.loadURL(ORIGIN);
}
function menu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Meldiq', submenu: [ { label: 'Desktop settings', accelerator: 'CmdOrCtrl+,', click: () => { show(); main?.webContents.send('desktop:settings'); } }, { label: 'Check for updates', click: () => { show(); main?.webContents.send('desktop:settings'); void updates.action('check').catch(() => undefined); } }, { type: 'separator' }, { label: 'Quit Meldiq', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() } ] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }] },
  ]));
  try {
    tray = new Tray(nativeImage.createFromPath(path.join(appRoot, 'desktop/resources/icon.png')).resize({ width: 24, height: 24 }));
    tray.setToolTip('Meldiq');
    tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open Meldiq', click: show }, { label: 'Desktop settings', click: () => { show(); main?.webContents.send('desktop:settings'); } }, { type: 'separator' }, { label: 'Quit', click: () => app.quit() }]));
    tray.on('double-click', show);
  } catch { tray = null; }
}
if (!single) app.quit();
else {
  app.on('second-instance', (_event, argv) => { show(); argv.filter(arg => arg.startsWith('meldiq://')).forEach(deepLink); });
  app.on('open-url', (event, url) => { event.preventDefault(); deepLink(url); });
  app.on('before-quit', event => {
    if (!quitting && busy() && main) { event.preventDefault(); show(); void dialog.showMessageBox(main, { type: 'info', message: 'Finish calls and transfers before quitting.', buttons: ['Keep Meldiq open'] }); return; }
    if (!quitting && updates?.installOnSafeExit()) { event.preventDefault(); return; }
    quitting = true;
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  void app.whenReady().then(async () => {
    app.setAppUserModelId('app.meldiq.desktop');
    const ses = session.fromPartition('persist:meldiq-desktop');
    await installProtocol(ses, path.join(appRoot, 'dist/renderer'), config);
    installIpc(ses); permissions(ses);
    ses.on('will-download', (_event, item, wc) => {
      if (wc !== main?.webContents) { item.cancel(); return; }
      downloads++; emitState();
      // Electron's save dialog keeps the user in charge of every destination and overwrite.
      item.once('done', () => { downloads--; emitState(); });
    });
    const privateUpdates = build.distribution === 'private-direct' && config.privateUpdatesEnabled === true;
    updates = new Updates(build, config.updateOrigin, privateUpdates || (config.releaseApproved && Boolean(config.publisherName)), config.publisherName, () => prefs.value, busy, emitState,
      privateUpdates ? { keys: config.updateKeys, appId: config.updateAppId ?? 'app.meldiq.desktop', checkpointFile: path.join(app.getPath('userData'), 'update-trust.json') } : undefined);
    nativeUpdater.on('before-quit-for-update', () => { quitting = true; });
    makeWindow(ses); menu();
    // eslint-disable-next-line no-unused-labels
    UPDATER_LAB: { void import('./update-lab').then(lab => lab.runUpdateLab({ app, main: main!, updates, control: config.updateLabControl })); }
    if (app.isPackaged) app.setAsDefaultProtocolClient('meldiq');
    else if (process.defaultApp && process.argv[1]) app.setAsDefaultProtocolClient('meldiq', process.execPath, [path.resolve(process.argv[1])]);
    process.argv.filter(arg => arg.startsWith('meldiq://')).forEach(deepLink);
    powerMonitor.on('resume', () => main?.webContents.send('desktop:navigate', '__resume'));
    app.on('activate', () => main ? show() : makeWindow(ses));
  }).catch(() => { dialog.showErrorBox('Meldiq could not start', 'The local application bundle could not be opened. Reinstall Meldiq or contact support.'); quitting = true; app.quit(); });
}
