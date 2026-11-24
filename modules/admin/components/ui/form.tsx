import type {
  FieldsetHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cx } from './base';
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

/** Error from the server / validation, at the top of a form. Renders nothing when empty. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className={css.formError} role="alert">
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
