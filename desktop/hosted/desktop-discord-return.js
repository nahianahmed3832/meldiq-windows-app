"use strict";
(() => {
  const q = new URLSearchParams(location.search);
  history.replaceState(null, '', '/discord/callback');
  const fail = () => { document.getElementById('status').textContent = 'This authorization is no longer connected. Start again from Meldiq.'; };
  if (location.origin !== 'https://web.meldiq.app' || [...q.keys()].length !== new Set(q.keys()).size) return fail();
  const token = /^[A-Za-z0-9_-]{43}$/;
  const code = /^[A-Za-z0-9._~-]{1,200}$/;
  const snowflake = /^\d{5,25}$/;
  try {
    const pending = JSON.parse(sessionStorage.getItem('meldiq.desktop.browserFlow') || 'null');
    if (pending?.kind === 'discord') {
      if (!token.test(pending.state || '') || pending.state !== q.get('state') ||
          !Number.isFinite(pending.expires) || pending.expires <= Date.now() || pending.expires > Date.now() + 10 * 60_000) return fail();
      const result = new URLSearchParams({ kind: 'discord-return' });
      for (const key of ['state', 'code', 'guild_id', 'error']) if (q.has(key)) result.set(key, q.get(key));
      location.replace(`/desktop-bridge.html#${result}`);
      return;
    }
    // Preserve the current web client's existing one-use return-storage contract.
    // Its authenticated backend still validates ownership, OAuth state and the code.
    const connected = code.test(q.get('code') || '') && code.test(q.get('state') || '') && !q.has('error');
    const result = connected ? { kind: 'connected', code: q.get('code'), state: q.get('state'), guildId: snowflake.test(q.get('guild_id') || '') ? q.get('guild_id') : null } : { kind: 'cancelled' };
    sessionStorage.setItem('meldiq.discordReturn', JSON.stringify(result));
    location.replace('/home');
  } catch { fail(); }
})();
