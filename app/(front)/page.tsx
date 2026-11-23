import ClientHealth from '@front/components/ClientHealth';
import { backendFetch } from '@shared/backend';

// Rendered per request: the backend isn't reachable during `next build`.
export const dynamic = 'force-dynamic';

async function getHealth() {
  // Server-side: straight to the backend container over the Docker network (no cookies, no extra headers).
  try {
    return await (await backendFetch('/health')).json();
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
