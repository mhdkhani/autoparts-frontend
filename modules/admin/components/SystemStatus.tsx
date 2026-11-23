import { backendFetch } from '@shared/backend';
import { adminToken } from '@admin/lib/auth';
import styles from './SystemStatus.module.css';

type Check = { ok: boolean; detail?: unknown; error?: string; ms?: number };

function describe(c: Check | undefined): string {
  if (!c) return 'unknown';
  const d = c.error ?? c.detail;
  const text = typeof d === 'string' ? d : JSON.stringify(d);
  return c.ms === undefined ? text : `${text} · ${c.ms} ms`;
}
type Health = Record<string, Check | string>;

const SERVICES: Record<string, string> = {
  postgres: 'PostgreSQL',
  redis: 'Redis',
  kafka: 'Kafka',
  elasticsearch: 'Elasticsearch',
};

async function getHealth(): Promise<Health | null> {
  // Server-side call over the Docker network to the admin-only detailed health check
  // (the public /api/health only says ok / degraded).
  try {
    const res = await backendFetch('/admin/system/health', { token: await adminToken() });
    return res.ok ? ((await res.json()) as Health) : null;
  } catch {
    return null;
  }
}

export default async function SystemStatus() {
  const health = await getHealth();
  const cards = [
    { name: 'Backend (NestJS)', ok: health !== null, detail: health ? String(health.status) : 'unreachable' },
    ...Object.entries(SERVICES).map(([key, name]) => {
      const c = health?.[key] as Check | undefined;
      return { name, ok: Boolean(c?.ok), detail: describe(c) };
    }),
  ];

  return (
    <section>
      <h2 className={styles.title}>وضعیت سرویس‌ها</h2>
      <div className={styles.grid}>
        {cards.map((c) => (
          <div key={c.name} className={styles.card}>
            <div className={styles.head}>
              <span className={c.ok ? styles.dotOk : styles.dotFail} />
              <strong dir="ltr">{c.name}</strong>
            </div>
            <div className={styles.detail} dir="ltr">
              {c.detail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
