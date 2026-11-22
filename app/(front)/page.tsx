import ClientHealth from '@front/components/ClientHealth';

// Rendered per request: the backend isn't reachable during `next build`.
export const dynamic = 'force-dynamic';

async function getHealth() {
  // Server-side: talk to the backend container directly over the Docker network.
  // API_INTERNAL_URL comes from infra/.env.
  const base = process.env.API_INTERNAL_URL;
  if (!base) throw new Error('Missing env var API_INTERNAL_URL (set it in infra/.env)');
  try {
    const res = await fetch(`${base}/api/health`, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    return { status: 'unreachable', error: String(e) };
  }
}

export default async function Home() {
  const health = await getHealth();
  const apiUrl = process.env.PUBLIC_API_URL;
  if (!apiUrl) throw new Error('Missing env var PUBLIC_API_URL (set it in infra/.env)');
  return (
    <main dir="ltr">
      <h1>Autoparts</h1>
      <h2>Server-side (SSR → backend:3000)</h2>
      <pre>{JSON.stringify(health, null, 2)}</pre>
      <ClientHealth apiUrl={apiUrl} />
    </main>
  );
}
