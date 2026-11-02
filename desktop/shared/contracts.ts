export type Channel = 'stable' | 'beta' | 'canary';
export interface Preferences {
  performance: 'auto' | 'balanced' | 'economy';
  cacheMB: 128 | 256 | 512;
  hardwareAcceleration: boolean;
  closeToTray: boolean;
  startAtLogin: boolean;
  notifications: boolean;
  updateMode: 'automatic' | 'ask' | 'manual';
  channel: Channel;
}
export interface AccountTokens {
  accessToken: string; accessTokenExpiresAt: number;
  refreshToken: string; refreshTokenExpiresAt: number; sessionId: string;
}
export interface BuildInfo {
  version: string; commit: string; timestamp: string; channel: Channel;
  distribution: 'development' | 'direct' | 'store';
}
export interface PerformanceProfile {
  mode: 'balanced' | 'economy'; ramGB: number; logicalCpus: number;
  reducedEffects: boolean; hardwareAcceleration: boolean;
}
export interface UpdateState {
  status: 'disabled' | 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  version?: string; percent?: number; message?: string;
}
export interface DesktopState {
  preferences: Preferences; profile: PerformanceProfile; build: BuildInfo;
  update: UpdateState; busy: boolean; cacheBytes: number;
}
export interface CaptureSource { id: string; name: string; thumbnail: string; displayId: string }
export interface DesktopBridge {
  state(): Promise<DesktopState>;
  preferences(patch: Partial<Preferences>): Promise<DesktopState>;
  clearTemporaryCache(): Promise<void>;
  openExternal(url: string): Promise<void>;
  update(action: 'check' | 'download' | 'install'): Promise<void>;
  setBusy(busy: boolean): Promise<void>;
  sealSession(tokens: AccountTokens): Promise<string>;
  openSession(sealed: string): Promise<AccountTokens>;
  notify(notice: { title: string; body: string; tag: string; href: string | null; silent?: boolean }): Promise<void>;
  socialAuthorize(flow: { id: string; url: string; expiresAt: number }): Promise<{ id: string; receipt: string }>;
  cancelSocial(id: string): Promise<void>;
  captureSources(): Promise<CaptureSource[]>;
  chooseCapture(id: string | null): Promise<void>;
  onState(callback: (state: DesktopState) => void): () => void;
  onNavigate(callback: (href: string) => void): () => void;
  onSettings(callback: () => void): () => void;
}
declare global { interface Window { meldiqDesktop?: DesktopBridge } }
