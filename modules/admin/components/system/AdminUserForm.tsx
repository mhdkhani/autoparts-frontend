'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { adminSend } from '@admin/lib/client-api';
import type { AdminRole, AdminUser } from '@admin/lib/types';
import ui from '../ui.module.css';

const PASSWORD_MIN = 10;

type Props = {
  roles: AdminRole[];
  /** show the «تعریف نقش جدید» link (the admin may manage roles) */
  canManageRoles: boolean;
  /** edit mode when given */
  user?: AdminUser;
  /** the admin is editing their own account (role / active can't be changed) */
  isSelf?: boolean;
};

/** «افزودن کاربر» / «ویرایش کاربر»: name, email, password, role (+ username for logging in). */
export default function AdminUserForm({ roles, canManageRoles, user, isSelf = false }: Props) {
  const router = useRouter();
  const editing = Boolean(user);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [roleId, setRoleId] = useState<number | ''>(user?.role.id ?? '');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function validate(): string {
    if (fullName.trim().length < 2) return 'نام را وارد کنید.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'ایمیل معتبر نیست.';
    if (!editing && !/^[a-z0-9._-]{3,50}$/.test(username.trim().toLowerCase())) {
      return 'نام کاربری باید ۳ تا ۵۰ حرف انگلیسی کوچک، عدد یا . _ - باشد.';
    }
    if ((!editing || password) && password.length < PASSWORD_MIN) {
      return `رمز عبور باید حداقل ${PASSWORD_MIN} کاراکتر باشد.`;
    }
    if (password !== password2) return 'رمز عبور و تکرار آن یکی نیستند.';
    if (roleId === '') return 'نقش را انتخاب کنید.';
    return '';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSaving(true);

    const body = editing
      ? {
          fullName,
          email,
          ...(password && { password }),
          ...(!isSelf && { roleId, isActive }),
        }
      : { username, fullName, email, password, roleId };
    const res = editing
      ? await adminSend('PATCH', `/users/${user!.id}`, body)
      : await adminSend('POST', '/users', body);

    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push('/admin/system/users');
    router.refresh();
  }

  return (
    <form className={ui.form} onSubmit={onSubmit} noValidate>
      {error && (
        <p className={ui.error} role="alert">
          {error}
        </p>
      )}

      <div className={ui.field}>
        <label className={`${ui.label} ${ui.required}`} htmlFor="fullName">
          نام و نام خانوادگی
        </label>
        <input id="fullName" className={ui.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className={ui.field}>
        <label className={`${ui.label} ${ui.required}`} htmlFor="email">
          ایمیل
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          className={ui.input}
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className={ui.field}>
        <label className={`${ui.label} ${editing ? '' : ui.required}`} htmlFor="username">
          نام کاربری
        </label>
        <input
          id="username"
          dir="ltr"
          className={ui.input}
          autoComplete="off"
          readOnly={editing}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <span className={ui.hint}>
          {editing ? 'نام کاربری قابل تغییر نیست.' : 'برای ورود به پنل (ورود با ایمیل هم ممکن است).'}
        </span>
      </div>

      <div className={ui.field}>
        <label className={`${ui.label} ${editing ? '' : ui.required}`} htmlFor="password">
          {editing ? 'رمز عبور جدید' : 'رمز عبور'}
        </label>
        <input
          id="password"
          type="password"
          dir="ltr"
          className={ui.input}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className={ui.hint}>
          حداقل {PASSWORD_MIN} کاراکتر.
          {editing && ' خالی بگذارید تا رمز فعلی بماند. با تغییر رمز، کاربر از همه‌ی دستگاه‌ها خارج می‌شود.'}
        </span>
      </div>

      <div className={ui.field}>
        <label className={`${ui.label} ${editing ? '' : ui.required}`} htmlFor="password2">
          تکرار رمز عبور
        </label>
        <input
          id="password2"
          type="password"
          dir="ltr"
          className={ui.input}
          autoComplete="new-password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </div>

      <div className={ui.field}>
        <label className={`${ui.label} ${ui.required}`} htmlFor="role">
          نقش
        </label>
        <select
          id="role"
          className={ui.select}
          value={roleId}
          disabled={isSelf}
          onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">— انتخاب نقش —</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.allPermissions ? ' (همه‌ی دسترسی‌ها)' : ''}
            </option>
          ))}
        </select>
        <span className={ui.hint}>
          {isSelf
            ? 'نقش خودتان را نمی‌توانید تغییر دهید.'
            : canManageRoles && (
                <>
                  نقش مناسب نیست؟ <Link href="/admin/system/roles/new">تعریف نقش جدید</Link>
                </>
              )}
        </span>
      </div>

      {editing && (
        <label className={ui.check}>
          <input
            type="checkbox"
            checked={isActive}
            disabled={isSelf}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>
            حساب فعال است
            <span className={ui.hint} style={{ display: 'block' }}>
              کاربر غیرفعال نمی‌تواند وارد پنل شود.
            </span>
          </span>
        </label>
      )}

      <div className={ui.actions}>
        <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={saving}>
          {saving ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت کاربر'}
        </button>
        <Link href="/admin/system/users" className={ui.btn}>
          انصراف
        </Link>
      </div>
    </form>
  );
}
