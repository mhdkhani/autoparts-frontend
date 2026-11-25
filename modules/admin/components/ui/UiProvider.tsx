'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, cx } from './base';
import css from './ui.module.css';

// Toasts and the confirm dialog of the panel. UiProvider sits in AdminShell, so a toast shown right
// before router.push() stays visible on the next page.
//
//   const toast = useToast();      toast.success('ذخیره شد.')   toast.error(res.error)
//   const confirm = useConfirm();  if (await confirm({ title: 'حذف نقش', message: '…', danger: true })) …

type ToastKind = 'success' | 'error';
type ToastItem = { id: number; kind: ToastKind; text: string };
export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  /** default: «تأیید» (or «حذف» when danger) */
  confirmLabel?: string;
  /** destructive action: red confirm button */
  danger?: boolean;
};
type ToastApi = { success: (text: string) => void; error: (text: string) => void };
type Ui = { toast: ToastApi; confirm: (o: ConfirmOptions) => Promise<boolean> };

const UiContext = createContext<Ui | null>(null);

const TOAST_MS = 4000;

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (kind: ToastKind, text: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, kind, text }]);
      setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );

  // confirm dialog: one at a time, answered through a promise
  const dialog = useRef<HTMLDialogElement>(null);
  const [ask, setAsk] = useState<ConfirmOptions | null>(null);
  const answer = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    answer.current?.(false);
    setAsk(o);
    return new Promise<boolean>((resolve) => (answer.current = resolve));
  }, []);

  useEffect(() => {
    if (ask && !dialog.current?.open) dialog.current?.showModal();
  }, [ask]);

  function close(ok: boolean) {
    answer.current?.(ok);
    answer.current = null;
    dialog.current?.close();
    setAsk(null);
  }

  const ui = useMemo<Ui>(
    () => ({ toast: { success: (t) => show('success', t), error: (t) => show('error', t) }, confirm }),
    [show, confirm],
  );

  return (
    <UiContext.Provider value={ui}>
      {children}

      <div className={css.toasts} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cx(css.toast, t.kind === 'error' && css.toastError)} role={t.kind === 'error' ? 'alert' : 'status'}>
            <span className={css.toastDot} aria-hidden />
            <span className={css.toastText}>{t.text}</span>
            <button type="button" className={css.toastClose} onClick={() => dismiss(t.id)} aria-label="بستن">
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Esc / backdrop «cancel» → answer false */}
      <dialog ref={dialog} className={css.dialog} onCancel={() => close(false)} aria-labelledby="ui-confirm-title">
        {ask && (
          <>
            <div className={css.dialogBody}>
              <h2 id="ui-confirm-title" className={css.dialogTitle}>
                {ask.title}
              </h2>
              {ask.message && <p className={css.dialogText}>{ask.message}</p>}
            </div>
            <div className={css.dialogActions}>
              <Button onClick={() => close(false)} autoFocus>
                انصراف
              </Button>
              <Button variant={ask.danger ? 'dangerSolid' : 'primary'} onClick={() => close(true)}>
                {ask.confirmLabel ?? (ask.danger ? 'حذف' : 'تأیید')}
              </Button>
            </div>
          </>
        )}
      </dialog>
    </UiContext.Provider>
  );
}

function useUi(): Ui {
  const ui = useContext(UiContext);
  if (!ui) throw new Error('useToast / useConfirm must be used inside <UiProvider> (AdminShell)');
  return ui;
}

export const useToast = () => useUi().toast;
export const useConfirm = () => useUi().confirm;
