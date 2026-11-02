import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge, DesktopState } from '../shared/contracts';
function subscribe<T>(channel: string, callback: (value: T) => void) {
  const listener = (_event: Electron.IpcRendererEvent, value: T) => callback(value);
  ipcRenderer.on(channel, listener);
  return () => { ipcRenderer.removeListener(channel, listener); };
}
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
  captureSources: () => ipcRenderer.invoke('desktop:capture-sources'),
  chooseCapture: id => ipcRenderer.invoke('desktop:capture-choose', id),
  onState: callback => subscribe<DesktopState>('desktop:state-changed', callback),
  onNavigate: callback => subscribe<string>('desktop:navigate', callback),
  onSettings: callback => subscribe<undefined>('desktop:settings', callback),
};
contextBridge.exposeInMainWorld('meldiqDesktop', Object.freeze(bridge));
