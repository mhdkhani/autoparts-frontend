'use client';

import { useEffect, useRef } from 'react';
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
