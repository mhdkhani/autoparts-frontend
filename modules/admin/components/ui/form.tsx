'use client';

import { useEffect, useRef, useState } from 'react';
import type { SendResult } from '@admin/lib/client-api';
import type {
  FieldsetHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Button, cx } from './base';
import css from './ui.module.css';

// Form building blocks. Plain elements styled by the kit — they take every normal prop (value, onChange, …).

/** White form box (max 560px wide). */
export function Form({ className, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form noValidate {...props} className={cx(css.form, className)} />;
}

/** Label + control + hint / error under it. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={css.field}>
      <label className={cx(css.label, required && css.required)} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <span className={css.fieldError}>{error}</span> : hint && <span className={css.hint}>{hint}</span>}
    </div>
  );
}

type Ltr = { /** left-to-right input (emails, usernames, numbers, URLs) */ ltr?: boolean };

export function Input({ ltr, className, ...props }: InputHTMLAttributes<HTMLInputElement> & Ltr) {
  return <input dir={ltr ? 'ltr' : undefined} {...props} className={cx(css.input, className)} />;
}

export function Textarea({ ltr, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & Ltr) {
  return <textarea dir={ltr ? 'ltr' : undefined} {...props} className={cx(css.input, className)} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(css.input, className)} />;
}

/** Checkbox with its label (and an optional hint line under the label). */
export function Checkbox({
  label,
  hint,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <label className={cx(css.check, className)}>
      <input type="checkbox" {...props} />
      <span>
        {label}
        {hint && <span className={css.checkHint}>{hint}</span>}
      </span>
    </label>
  );
}

/** Box around related checkboxes / fields; `disabled` greys out and disables everything inside. */
export function Fieldset({ legend, children, ...props }: FieldsetHTMLAttributes<HTMLFieldSetElement> & { legend: ReactNode }) {
  return (
    <fieldset {...props} className={css.fieldset}>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Error from the server / validation, at the top of a form. Renders nothing when empty.
 * Scrolls itself into view when it appears, so it's seen even when Save was pressed at the bottom of a long form.
 */
export function FormError({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    // instant, not smooth: a smooth scroll never runs while the tab is in the background
    if (children) ref.current?.scrollIntoView({ block: 'center' });
  }, [children]);
  if (!children) return null;
  return (
    <p ref={ref} className={css.formError} role="alert">
      {children}
    </p>
  );
}

/** Row of buttons at the bottom of a form; put <Spacer /> before buttons that belong at the far end. */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className={css.actions}>{children}</div>;
}

export function Spacer() {
  return <span className={css.spacer} />;
}

/** Hint text (small, grey). */
export function Hint({ children }: { children: ReactNode }) {
  return <p className={css.hint}>{children}</p>;
}

// ---------- ordered, editable lists (select options, groups of an attribute set, …) ----------

/** list with item `index` moved by `delta` places (−1 = up, +1 = down); a copy, unchanged at the ends. */
export function moveItem<T>(list: readonly T[], index: number, delta: number): T[] {
  const next = [...list];
  const to = index + delta;
  if (to < 0 || to >= list.length) return next;
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/** ▲ ▼ ✕ buttons of one row of an ordered list. */
export function OrderButtons({
  index,
  count,
  onMove,
  onRemove,
  removeLabel = 'حذف',
}: {
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
  removeLabel?: string;
}) {
  return (
    <span className={css.orderButtons}>
      <Button size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label="انتقال به بالا" title="بالا">
        ▲
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="انتقال به پایین" title="پایین">
        ▼
      </Button>
      <Button size="sm" variant="ghost" onClick={onRemove} aria-label={removeLabel} title={removeLabel}>
        ✕
      </Button>
    </span>
  );
}

// ---------- one field's input: site settings and EAV attribute values share it ----------

/** What FieldControl needs to know about a field (a site setting, or a category / product attribute). */
export type FieldSpec = {
  /** editor = a textarea edited as formatted text (HTML; the API cleans it) */
  type: 'text' | 'textarea' | 'editor' | 'boolean' | 'select' | 'image';
  maxLength?: number;
  /** left-to-right input (numbers, URLs, codes) */
  ltr?: boolean;
  /** select */
  options?: { value: string; label: string }[];
  /** select: an empty first choice with this text ('' = no value) — for optional selects */
  placeholder?: string;
};

/** Uploads one image and resolves to its URL — the form decides the endpoint, e.g. (f) => adminUpload('/config/upload', f). */
export type UploadImage = (file: File) => Promise<SendResult<{ url: string }>>;

/**
 * The input for one field. Every value is a string: '' = empty, booleans '1' / '0', an image = its URL.
 * `uploadImage` is required for `image` fields.
 */
export function FieldControl({
  id,
  field,
  value,
  onChange,
  uploadImage,
}: {
  id: string;
  field: FieldSpec;
  value: string;
  onChange: (value: string) => void;
  uploadImage?: UploadImage;
}) {
  switch (field.type) {
    case 'text':
      return <Input id={id} ltr={field.ltr} maxLength={field.maxLength} value={value} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return <Textarea id={id} maxLength={field.maxLength} value={value} onChange={(e) => onChange(e.target.value)} />;
    case 'editor':
      return <TextEditor id={id} value={value} onChange={onChange} />;
    case 'boolean':
      return (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="1">فعال</option>
          <option value="0">غیرفعال</option>
        </Select>
      );
    case 'select':
      return (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.placeholder !== undefined && <option value="">{field.placeholder}</option>}
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case 'image':
      if (!uploadImage) throw new Error(`FieldControl "${id}": an image field needs uploadImage`);
      return <ImageControl id={id} value={value} onChange={onChange} uploadImage={uploadImage} />;
  }
}

/** Toolbar of the text editor: each button runs a browser editing command on the selection. */
const EDITOR_ACTIONS: { label: string; title: string; command: string; arg?: string }[] = [
  { label: 'B', title: 'پررنگ', command: 'bold' },
  { label: 'I', title: 'کج', command: 'italic' },
  { label: 'U', title: 'زیرخط', command: 'underline' },
  { label: 'H2', title: 'عنوان', command: 'formatBlock', arg: 'h2' },
  { label: 'H3', title: 'زیرعنوان', command: 'formatBlock', arg: 'h3' },
  { label: '¶', title: 'متن عادی', command: 'formatBlock', arg: 'p' },
  { label: '•', title: 'فهرست نقطه‌ای', command: 'insertUnorderedList' },
  { label: '1.', title: 'فهرست شماره‌دار', command: 'insertOrderedList' },
  { label: 'حذف لینک', title: 'حذف لینک', command: 'unlink' },
  { label: 'پاک‌سازی', title: 'حذف قالب‌بندی', command: 'removeFormat' },
];

/**
 * A small WYSIWYG editor (no library): a toolbar over an editable area; the value is the area's HTML.
 * Pasted text comes in as plain text, so formatting from other sites isn't carried over. The API keeps only the
 * tags this toolbar makes and drops empty paragraphs (backend common/html.ts) — never trust this HTML before it has
 * been through the API.
 */
function TextEditor({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const area = useRef<HTMLDivElement>(null);
  /** selection kept while the link box has the focus */
  const selection = useRef<Range | null>(null);
  /** URL being typed in the link box; null = box closed */
  const [link, setLink] = useState<string | null>(null);

  // put `value` into the area only when it differs (re-setting it while typing would move the caret)
  useEffect(() => {
    if (area.current && area.current.innerHTML !== value) area.current.innerHTML = value;
  }, [value]);

  const emit = () => onChange(area.current!.innerHTML);
  function run(command: string, arg?: string) {
    area.current!.focus();
    document.execCommand(command, false, arg);
    emit();
  }

  function openLink() {
    const sel = window.getSelection();
    selection.current = sel?.rangeCount && area.current!.contains(sel.anchorNode) ? sel.getRangeAt(0) : null;
    setLink('https://');
  }
  function addLink() {
    const url = link?.trim();
    setLink(null);
    if (!url || url === 'https://' || !selection.current) return;
    area.current!.focus();
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(selection.current);
    run('createLink', url);
  }

  return (
    <div className={css.editor}>
      <div className={css.editorBar} role="toolbar" aria-label="قالب‌بندی متن">
        {EDITOR_ACTIONS.map((a) => (
          <button
            key={a.title}
            type="button"
            className={css.editorButton}
            title={a.title}
            aria-label={a.title}
            // keep the focus (and the selection) in the text while clicking a button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(a.command, a.arg)}
          >
            {a.label}
          </button>
        ))}
        <button type="button" className={css.editorButton} title="افزودن لینک" onMouseDown={(e) => e.preventDefault()} onClick={openLink}>
          لینک
        </button>
      </div>
      {link !== null && (
        <div className={css.editorLink}>
          <Input
            ltr
            aria-label="آدرس لینک"
            value={link}
            autoFocus
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <Button size="sm" onClick={addLink}>
            افزودن لینک
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setLink(null)}>
            انصراف
          </Button>
        </div>
      )}
      <div
        id={id}
        ref={area}
        className={css.editorArea}
        role="textbox"
        aria-multiline
        contentEditable
        suppressContentEditableWarning
        // new lines become <p> (the browser default is <div>)
        onFocus={() => document.execCommand('defaultParagraphSeparator', false, 'p')}
        onInput={emit}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
      />
    </div>
  );
}

/** Preview + upload + remove. The uploaded image's URL becomes the value; it is stored when the form is saved. */
function ImageControl({
  id,
  value,
  onChange,
  uploadImage,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  uploadImage: UploadImage;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    setError('');
    setBusy(true);
    const res = await uploadImage(file);
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
      <div className={css.imageBox}>
        <div className={css.imagePreview}>
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
        <Button onClick={() => input.current?.click()} loading={busy}>
          {busy ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'انتخاب تصویر'}
        </Button>
        {value && (
          <Button variant="danger" onClick={() => onChange('')} disabled={busy}>
            حذف
          </Button>
        )}
      </div>
      {error && <span className={css.fieldError}>{error}</span>}
    </div>
  );
}

// ---------- tabs of a form (e.g. the groups of an attribute set) ----------

export type Tab = { key: string; label: ReactNode; content: ReactNode };

/**
 * Tabs above panels. Every panel stays mounted (fields keep their values), only the active one is shown.
 * Uncontrolled by default; pass `active` + `onSelect` to switch tabs from outside (e.g. to the tab of a field
 * that failed validation).
 */
export function Tabs({ tabs, active, onSelect }: { tabs: Tab[]; active?: string; onSelect?: (key: string) => void }) {
  const [own, setOwn] = useState(tabs[0]?.key);
  const current = active ?? own;
  const select = (key: string) => (onSelect ? onSelect(key) : setOwn(key));
  return (
    <div>
      <div role="tablist" className={css.tabList}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === current}
            className={cx(css.tab, t.key === current && css.tabActive)}
            onClick={() => select(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" hidden={t.key !== current}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
