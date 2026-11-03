"use strict";
(() => {
  const KEY = 'meldiq.desktop.browserFlow';
  const TOKEN = /^[A-Za-z0-9_-]{43}$/;
  const q = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', location.pathname);
  const status = document.getElementById('status');
  const failed = () => { status.textContent = 'This authorization has expired or is not connected. Start again from Meldiq.'; };
  if (location.origin !== 'https://web.meldiq.app' || [...q.keys()].length !== new Set(q.keys()).size) return failed();
  const write = value => sessionStorage.setItem(KEY, JSON.stringify({ ...value, expires: Date.now() + 10 * 60_000 }));
  const read = () => {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return Number.isFinite(value.expires) && value.expires > Date.now() && value.expires <= Date.now() + 10 * 60_000 ? value : null;
  };
  const handoff = (scheme, values) => {
    const link = document.getElementById('open');
    link.href = `meldiq://${scheme}/callback#${new URLSearchParams(values)}`;
    link.hidden = false;
    document.getElementById('help').hidden = false;
    status.textContent = 'Authorization finished. Open Meldiq to continue securely.';
    // A visible, user-initiated link survives browsers that block automatic custom-scheme redirects.
    link.focus();
  };
  try {
    if (q.get('kind') === 'social' && TOKEN.test(q.get('id') || '') && [...q.keys()].every(k => ['kind', 'id'].includes(k))) {
      write({ kind: 'social', id: q.get('id') });
      location.replace(`/v2/auth/social/authorize/${q.get('id')}`);
      return;
    }
    if (q.get('kind') === 'discord' && [...q.keys()].every(k => ['kind', 'url'].includes(k))) {
      const url = new URL(q.get('url')), d = url.searchParams;
      const scopes = (d.get('scope') || '').split(' ');
      if (url.origin !== 'https://discord.com' || url.username || url.password || url.hash || url.pathname !== '/oauth2/authorize' || [...d.keys()].length !== new Set(d.keys()).size || !TOKEN.test(d.get('state') || '') || !/^\d{5,25}$/.test(d.get('client_id') || '') || d.get('response_type') !== 'code' || d.get('redirect_uri') !== `${location.origin}/discord/callback` || !scopes.length || scopes.some(s => !['bot', 'identify', 'guilds'].includes(s))) return failed();
      write({ kind: 'discord', state: d.get('state') });
      location.replace(url.href);
      return;
    }
    const pending = read();
    if (q.get('kind') === 'social-return' && pending?.kind === 'social' && pending.id === q.get('id') && TOKEN.test(q.get('id') || '') && [...q.keys()].every(k => ['kind', 'id', 'receipt', 'error'].includes(k))) {
      const receipt = q.get('receipt'), error = q.get('error');
      if ((receipt !== null && !TOKEN.test(receipt)) || (error !== null && !['cancelled', 'verification_failed'].includes(error)) || Boolean(receipt) === Boolean(error)) return failed();
      handoff('auth', { id: pending.id, ...(receipt ? { receipt } : { error }) });
      return;
    }
    if (q.get('kind') === 'discord-return' && pending?.kind === 'discord' && pending.state === q.get('state') && TOKEN.test(q.get('state') || '') && [...q.keys()].every(k => ['kind', 'state', 'code', 'guild_id', 'error'].includes(k))) {
      const code = q.get('code'), error = q.get('error'), guild = q.get('guild_id');
      if ((code !== null && !/^[A-Za-z0-9._~-]{1,200}$/.test(code)) || (guild !== null && !/^\d{5,25}$/.test(guild)) || (error !== null && error !== 'access_denied') || Boolean(code) === Boolean(error) || (error && guild)) return failed();
      handoff('discord', { state: pending.state, ...(code ? { code, ...(guild ? { guild_id: guild } : {}) } : { error }) });
      return;
    }
    failed();
  } catch { failed(); }
})();
