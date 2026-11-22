'use client';

import { useEffect, useState } from 'react';

// Browser-side: relative /api, routed to the backend by nginx.
// apiUrl is PUBLIC_API_URL from infra/.env, read on the server at request time
// and passed in as a prop — nothing is baked into the build.
export default function ClientHealth({ apiUrl }: { apiUrl: string }) {
  const [data, setData] = useState<unknown>('loading…');

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setData({ status: 'unreachable', error: String(e) }));
  }, [apiUrl]);

  return (
    <>
      <h2>Browser-side (/api → nginx → backend)</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}
