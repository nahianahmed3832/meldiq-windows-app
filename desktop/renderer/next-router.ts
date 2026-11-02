// The shared client uses its own History router. Only these Next lifecycle events are consumed.
const events = { on: (_name: string, _callback: () => void) => undefined, off: (_name: string, _callback: () => void) => undefined };
export default { events };
