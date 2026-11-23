'use client';

import { useState } from 'react';
import { ADMIN_API } from '@admin/lib/client-api';

/** Logout through the proxy: the API revokes the token, the proxy deletes the httpOnly cookie. */
export default function LogoutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch(`${ADMIN_API}/auth/logout`, { method: 'POST', credentials: 'same-origin' });
    } finally {
      // full page load: drops every cached panel page from the client router
      window.location.assign('/admin/login');
    }
  }

  return (
    <button type="button" className={className} onClick={logout} disabled={busy}>
      {busy ? 'در حال خروج…' : 'خروج'}
    </button>
  );
}
