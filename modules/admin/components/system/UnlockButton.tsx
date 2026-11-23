'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminSend } from '@admin/lib/client-api';
import ui from '../ui.module.css';

/** «باز کردن قفل» on the locked users page. */
export default function UnlockButton({ userId }: { userId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    const res = await adminSend('POST', `/users/${userId}/unlock`);
    if (!res.ok) window.alert(res.error);
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" className={`${ui.btn} ${ui.small}`} onClick={unlock} disabled={busy}>
      {busy ? '…' : 'باز کردن قفل'}
    </button>
  );
}
