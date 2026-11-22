'use client';

import { useEffect, useState } from 'react';

// Browser-side: relative /api, routed to the backend by nginx.
// NEXT_PUBLIC_API_URL comes from infra/.env (inlined into the bundle at build time).
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClientHealth() {
  const [data, setData] = useState<unknown>('loading…');

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setData({ status: 'unreachable', error: String(e) }));
  }, []);

  return (
    <>
      <h2>Browser-side (/api → nginx → backend)</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}
