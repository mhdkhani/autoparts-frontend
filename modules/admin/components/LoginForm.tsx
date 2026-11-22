'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید.');
      return;
    }
    setError('');
    setSubmitting(true);
    // TODO: not connected to the backend yet — any username/password is accepted.
    // Later: POST /api/admin/auth/login, keep the session (httpOnly cookie),
    // and guard /admin/* so the panel can't be opened without it.
    router.replace('/admin');
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>ورود به پنل مدیریت</h1>

        <label className={styles.label} htmlFor="username">
          نام کاربری
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
