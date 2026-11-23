'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ADMIN_API } from '@admin/lib/client-api';
import styles from './LoginForm.module.css';

const NETWORK_ERROR = 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.';

/** Persian message for a failed login response (the backend already sends Persian for 401 / 429). */
async function errorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: unknown } | null;
  const msg = typeof body?.message === 'string' ? body.message : '';
  if (res.status === 401) return msg || 'نام کاربری یا رمز عبور اشتباه است';
  if (res.status === 429) return msg || 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید';
  if (res.status === 400) return 'نام کاربری یا رمز عبور معتبر نیست';
  return NETWORK_ERROR;
}

/**
 * Posts to the /admin/api proxy; the proxy gets the token from the API and keeps it in the httpOnly
 * ap_admin cookie — the token never reaches JavaScript. next = where to go after login.
 */
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('نام کاربری (یا ایمیل) و رمز عبور را وارد کنید.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${ADMIN_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
        return; // keep the button disabled while the panel loads
      }
      setError(await errorMessage(res));
    } catch {
      setError(NETWORK_ERROR);
    }
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>ورود به پنل مدیریت</h1>

        <label className={styles.label} htmlFor="username">
          نام کاربری یا ایمیل
        </label>
        <input
          id="username"
          name="username"
          className={styles.input}
          dir="ltr"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label className={styles.label} htmlFor="password">
          رمز عبور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          dir="ltr"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? 'در حال ورود…' : 'ورود'}
        </button>
      </form>
    </div>
  );
}
