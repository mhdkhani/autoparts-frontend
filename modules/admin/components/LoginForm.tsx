'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { adminSend } from '@admin/lib/client-api';
import { Button, Field, FormError, Input } from './ui';
import styles from './LoginForm.module.css';

/**
 * Posts to the /admin/api proxy; the proxy gets the token from the API and keeps it in the httpOnly
 * ap_admin cookie — the token never reaches JavaScript. next = where to go after login.
 * 401 / 429 messages come from the backend in Persian.
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
    const res = await adminSend('POST', '/auth/login', { username: username.trim(), password }, { redirectOn401: false });
    if (res.ok) {
      router.replace(next);
      router.refresh();
      return; // keep the button disabled while the panel loads
    }
    setError(res.status === 400 ? 'نام کاربری یا رمز عبور معتبر نیست' : res.error);
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>ورود به پنل مدیریت</h1>

        <Field label="نام کاربری یا ایمیل" htmlFor="username">
          <Input
            id="username"
            name="username"
            ltr
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <Field label="رمز عبور" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            ltr
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <FormError>{error}</FormError>

        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? 'در حال ورود…' : 'ورود'}
        </Button>
      </form>
    </div>
  );
}
