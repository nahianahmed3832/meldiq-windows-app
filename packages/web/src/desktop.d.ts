// Desktop-only bridge types. Upstream source remains usable without a native bridge.
import type { DesktopBridge } from '../../../desktop/shared/contracts';
declare global { interface Window { meldiqDesktop?: DesktopBridge } }
