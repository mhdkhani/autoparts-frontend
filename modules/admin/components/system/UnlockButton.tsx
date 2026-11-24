'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminSend } from '@admin/lib/client-api';
import { Button, useToast } from '../ui';

/** «باز کردن قفل» on the locked users page. */
export default function UnlockButton({ userId }: { userId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    const res = await adminSend('POST', `/users/${userId}/unlock`);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('قفل حساب باز شد.');
    router.refresh();
  }

  return (
    <Button size="sm" onClick={unlock} loading={busy}>
      باز کردن قفل
    </Button>
  );
}
