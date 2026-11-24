'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { adminSend } from '@admin/lib/client-api';
import type { AdminRole, AdminUser } from '@admin/lib/types';
import { Button, Checkbox, Field, Form, FormActions, FormError, Input, Select, useToast } from '../ui';

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
  const toast = useToast();
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
    toast.success(editing ? 'تغییرات کاربر ذخیره شد.' : 'کاربر جدید ساخته شد.');
    router.push('/admin/system/users');
    router.refresh();
  }

  return (
    <Form onSubmit={onSubmit}>
      <FormError>{error}</FormError>

      <Field label="نام و نام خانوادگی" htmlFor="fullName" required>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>

      <Field label="ایمیل" htmlFor="email" required>
        <Input id="email" type="email" ltr autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <Field
        label="نام کاربری"
        htmlFor="username"
        required={!editing}
        hint={editing ? 'نام کاربری قابل تغییر نیست.' : 'برای ورود به پنل (ورود با ایمیل هم ممکن است).'}
      >
        <Input
          id="username"
          ltr
          autoComplete="off"
          readOnly={editing}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Field>

      <Field
        label={editing ? 'رمز عبور جدید' : 'رمز عبور'}
        htmlFor="password"
        required={!editing}
        hint={
          <>
            حداقل {PASSWORD_MIN} کاراکتر.
            {editing && ' خالی بگذارید تا رمز فعلی بماند. با تغییر رمز، کاربر از همه‌ی دستگاه‌ها خارج می‌شود.'}
          </>
        }
      >
        <Input
          id="password"
          type="password"
          ltr
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <Field label="تکرار رمز عبور" htmlFor="password2" required={!editing}>
        <Input
          id="password2"
          type="password"
          ltr
          autoComplete="new-password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </Field>

      <Field
        label="نقش"
        htmlFor="role"
        required
        hint={
          isSelf
            ? 'نقش خودتان را نمی‌توانید تغییر دهید.'
            : canManageRoles && (
                <>
                  نقش مناسب نیست؟ <Link href="/admin/system/roles/new">تعریف نقش جدید</Link>
                </>
              )
        }
      >
        <Select
          id="role"
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
        </Select>
      </Field>

      {editing && (
        <Checkbox
          label="حساب فعال است"
          hint="کاربر غیرفعال نمی‌تواند وارد پنل شود."
          checked={isActive}
          disabled={isSelf}
          onChange={(e) => setIsActive(e.target.checked)}
        />
      )}

      <FormActions>
        <Button type="submit" variant="primary" loading={saving}>
          {saving ? 'در حال ذخیره…' : editing ? 'ذخیره‌ی تغییرات' : 'ساخت کاربر'}
        </Button>
        <Button href="/admin/system/users">انصراف</Button>
      </FormActions>
    </Form>
  );
}
