# Troubleshooting

Offline sign-in screen renders but data is unavailable: packaged assets work independently; synchronized account operations still require the existing backend. This environment's public production probes returned 403. Check allowed API/WSS reachability and backend origin configuration; never disable webSecurity or change auth policy as a workaround.

Graphics issues: open Desktop settings and turn off hardware acceleration, quit after calls/transfers finish, then restart. Economy mode removes animations/effects. For a window that cannot paint, edit only `desktop-preferences.json` under Meldiq userData to set `hardwareAcceleration: false`; preserve the rest of the profile and never delete account databases to fix graphics.

No microphone/camera/output: messaging remains available. Check Windows privacy permissions, reconnect the device, refresh Voice & Audio device selection and retry. Native test capture stops after ten seconds and always stops tracks on close. LiveKit's ended-track handler attempts default-device fallback and safely mutes if restart fails; physical unplug/reconnect tests remain pending.

Screen sharing unavailable: choose a monitor/window in the local picker; cancel never selects a source. A device disconnected while sharing should stop its track. Check OS capture support and permission. Do not bypass the picker or choose the first screen automatically.

Session cannot be restored: OS protected bytes are bound to the signed-in OS account/credential store. Sign in again after moving a profile to another user/machine. No plaintext fallback is enabled. Ordinary cache clearing preserves session data and encryption keys.

Update unavailable in development: expected. Only approved signed direct Windows releases enable the updater. A signature failure must be investigated; do not disable verification. Finish active calls/transfers before restart. Use a higher corrective release for a bad update.

App remains in tray: use tray Open Meldiq or Quit. Disable close-to-tray in Desktop settings. Startup registration is an explicit preference. Tray failure falls back to ordinary close behavior.
