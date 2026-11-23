'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { adminSend } from '@admin/lib/client-api';
import type { ConfigField, ConfigSection, ConfigValues } from '@admin/lib/types';
import ui from '../ui.module.css';
import css from './config.module.css';

/** One settings section: its groups as cards, every field in a label | control row, one Save button. */
export default function ConfigSectionForm({
  section,
  initial,
}: {
  section: ConfigSection;
  initial: ConfigValues;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<ConfigValues>(initial);
  const [values, setValues] = useState<ConfigValues>(initial);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const changed = Object.keys(values).filter((p) => values[p] !== saved[p]);
  const dirty = changed.length > 0;

  // warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function set(path: string, value: string) {
    setValues((v) => ({ ...v, [path]: value }));
    setMessage('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    const body = { values: Object.fromEntries(changed.map((p) => [p, values[p]])) };
    const res = await adminSend<{ values: ConfigValues }>('PUT', `/config/${section.key}`, body);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(res.data.values);
    setValues(res.data.values);
    setMessage('تنظیمات ذخیره شد.');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {error && (
        <p className={ui.error} role="alert">
          {error}
        </p>
      )}

      {section.groups.map((g) => (
        <section key={g.key} className={css.group}>
          <div className={css.groupHead}>
            <h2 className={css.groupTitle}>{g.label}</h2>
            {g.description && <p className={css.groupDesc}>{g.description}</p>}
          </div>
          <div className={css.fields}>
            {g.fields.map((f) => {
              const path = `${section.key}/${g.key}/${f.key}`;
              return (
                <div key={path} className={css.row}>
                  <label className={css.rowLabel} htmlFor={path}>
                    {f.label}
                  </label>
                  <div>
                    <FieldControl id={path} field={f} value={values[path] ?? ''} onChange={(v) => set(path, v)} />
                    {f.comment && <div className={ui.hint}>{f.comment}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className={css.saveBar}>
        <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={saving || !dirty}>
          {saving ? 'در حال ذخیره…' : 'ذخیره‌ی تنظیمات'}
        </button>
        {dirty && <span className={css.dirty}>تغییرات ذخیره نشده دارید.</span>}
        {!dirty && message && (
          <span className={css.saved} role="status">
            {message}
          </span>
        )}
        {dirty && (
          <>
            <span className={ui.spacer} />
            <button type="button" className={ui.btn} onClick={() => setValues(saved)} disabled={saving}>
              لغو تغییرات
            </button>
          </>
        )}
      </div>
    </form>
  );
}

type ControlProps = {
  id: string;
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
};

function FieldControl({ id, field, value, onChange }: ControlProps) {
  switch (field.type) {
    case 'text':
      return (
        <input
          id={id}
          className={ui.input}
          style={{ width: '100%' }}
          dir={field.ltr ? 'ltr' : undefined}
          maxLength={field.maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'textarea':
      return (
        <textarea
          id={id}
          className={`${ui.input} ${css.textarea}`}
          style={{ width: '100%' }}
          maxLength={field.maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'boolean':
      return (
        <select id={id} className={ui.select} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="1">فعال</option>
          <option value="0">غیرفعال</option>
        </select>
      );
    case 'select':
      return (
        <select id={id} className={ui.select} style={{ width: '100%' }} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'image':
      return <ImageControl id={id} value={value} onChange={onChange} />;
  }
}

/** Preview + upload (POST /admin/config/upload) + remove. The URL becomes the field value; it's stored on Save. */
function ImageControl({ id, value, onChange }: Omit<ControlProps, 'field'>) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    setError('');
    setBusy(true);
    const form = new FormData();
    form.append('file', file);
    const res = await adminSend<{ url: string }>('POST', '/config/upload', form);
    setBusy(false);
    if (input.current) input.current.value = '';
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onChange(res.data.url);
  }

  return (
    <div>
      <div className={css.logoBox}>
        <div className={css.logoPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element -- served by nginx from the media volume */}
          {value ? <img src={value} alt="" /> : 'بدون تصویر'}
        </div>
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <button type="button" className={ui.btn} onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'انتخاب تصویر'}
        </button>
        {value && (
          <button type="button" className={`${ui.btn} ${ui.danger}`} onClick={() => onChange('')} disabled={busy}>
            حذف
          </button>
        )}
      </div>
      {error && (
        <p className={ui.error} role="alert" style={{ marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
