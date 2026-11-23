'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { adminSend } from '@admin/lib/client-api';
import type { AdminRole, Permission, PermissionInfo } from '@admin/lib/types';
import ui from '../ui.module.css';

type Props = {
  permissions: PermissionInfo[];
  /** edit mode when given */
  role?: AdminRole;
};

/** «افزودن نقش» / «ویرایش نقش»: name + which parts of the panel it may use. */
export default function AdminRoleForm({ permissions, role }: Props) {
  const router = useRouter();
  const editing = Boolean(role);
  const [name, setName] = useState(role?.name ?? '');
  const [all, setAll] = useState(role?.allPermissions ?? false);
  const [selected, setSelected] = useState<Permission[]>(role?.permissions ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // permissions grouped by their menu path («سایت › دسترسی‌ها»)
  const groups = [...new Set(permissions.map((p) => p.group))].map((g) => ({
    title: g,
    items: permissions.filter((p) => p.group === g),
  }));

  function toggle(key: Permission, on: boolean) {
    setSelected((s) => (on ? [...s, key] : s.filter((k) => k !== key)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('نام نقش را وارد کنید.');
      return;
    }
    setError('');
    setBusy(true);
    const body = { name, allPermissions: all, permissions: all ? [] : selected };
    const res = editing
      ? await adminSend('PUT', `/roles/${role!.id}`, body)
      : await adminSend('POST', '/roles', body);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push('/admin/system/roles');
    router.refresh();
  }

  async function onDelete() {
    if (!role || !window.confirm(`نقش «${role.name}» حذف شود؟`)) return;
    setError('');
    setBusy(true);
    const res = await adminSend('DELETE', `/roles/${role.id}`);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push('/admin/system/roles');
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
        <label className={`${ui.label} ${ui.required}`} htmlFor="name">
          نام نقش
        </label>
        <input id="name" className={ui.input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <label className={ui.check}>
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
        <span>
          <strong>همه‌ی دسترسی‌ها</strong>
          <span className={ui.hint} style={{ display: 'block' }}>
            به همه‌ی بخش‌های پنل دسترسی دارد، از جمله بخش‌هایی که بعداً اضافه می‌شوند.
          </span>
        </span>
      </label>

      {groups.map((g) => (
        <fieldset key={g.title} className={`${ui.fieldset} ${all ? ui.fieldsetDisabled : ''}`} disabled={all}>
          <legend>{g.title}</legend>
          {g.items.map((p) => (
            <label key={p.key} className={ui.check}>
              <input
                type="checkbox"
                checked={all || selected.includes(p.key)}
                onChange={(e) => toggle(p.key, e.target.checked)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <p className={ui.hint}>داشبورد برای همه‌ی نقش‌ها باز است.</p>

      <div className={ui.actions}>
        <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={busy}>
          {busy ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت نقش'}
        </button>
        <Link href="/admin/system/roles" className={ui.btn}>
          انصراف
        </Link>
        {editing && (
          <>
            <span className={ui.spacer} />
            <button type="button" className={`${ui.btn} ${ui.danger}`} onClick={onDelete} disabled={busy}>
              حذف نقش
            </button>
          </>
        )}
      </div>
    </form>
  );
}
