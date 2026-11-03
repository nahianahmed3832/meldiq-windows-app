import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge, DesktopState } from '../shared/contracts';
function subscribe<T>(channel: string, callback: (value: T) => void) {
  const listener = (_event: Electron.IpcRendererEvent, value: T) => callback(value);
  ipcRenderer.on(channel, listener);
  return () => { ipcRenderer.removeListener(channel, listener); };
}
const navigationListeners = new Set<(href: string) => void>();
const pendingNavigation: string[] = [];
ipcRenderer.on('desktop:navigate', (_event, href: string) => {
  if (navigationListeners.size) navigationListeners.forEach(callback => callback(href));
  else { pendingNavigation.push(href); if (pendingNavigation.length > 10) pendingNavigation.shift(); }
});
const bridge: DesktopBridge = {
  state: () => ipcRenderer.invoke('desktop:state'),
  preferences: patch => ipcRenderer.invoke('desktop:preferences', patch),
  clearTemporaryCache: () => ipcRenderer.invoke('desktop:clear-cache'),
  openExternal: url => ipcRenderer.invoke('desktop:external', url),
  update: action => ipcRenderer.invoke('desktop:update', action),
  setBusy: busy => ipcRenderer.invoke('desktop:busy', busy),
  sealSession: tokens => ipcRenderer.invoke('desktop:seal', tokens),
  openSession: sealed => ipcRenderer.invoke('desktop:unseal', sealed),
  notify: notice => ipcRenderer.invoke('desktop:notify', notice),
  socialAuthorize: flow => ipcRenderer.invoke('desktop:social', flow),
  cancelSocial: id => ipcRenderer.invoke('desktop:cancel-social', id),
  discordAuthorize: url => ipcRenderer.invoke('desktop:discord', url),
  cancelDiscord: () => ipcRenderer.invoke('desktop:cancel-discord'),
  resetPermissions: () => ipcRenderer.invoke('desktop:reset-permissions'),
  onCheckout: callback => subscribe('desktop:checkout', callback),
  captureSources: () => ipcRenderer.invoke('desktop:capture-sources'),
  chooseCapture: id => ipcRenderer.invoke('desktop:capture-choose', id),
  onState: callback => subscribe<DesktopState>('desktop:state-changed', callback),
  onNavigate: callback => {
    navigationListeners.add(callback);
    pendingNavigation.splice(0).forEach(callback);
    return () => { navigationListeners.delete(callback); };
  },
  onSettings: callback => subscribe<undefined>('desktop:settings', callback),
};
contextBridge.exposeInMainWorld('meldiqDesktop', Object.freeze(bridge));
