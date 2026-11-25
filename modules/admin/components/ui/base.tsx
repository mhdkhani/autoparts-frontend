import Link from 'next/link';
import { Fragment, type ButtonHTMLAttributes, type ReactNode } from 'react';
import css from './ui.module.css';

// Basic building blocks of the admin UI kit. No hooks here: usable in server and client components.

/** Joins class names, skipping empty ones: cx('a', ok && 'b') */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

// ---------- icons: plain inline SVG (no icon library), stroked with currentColor ----------
const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  parts: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  system: (
    <>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  empty: (
    <>
      <path d="M3 13h5l1.5 3h5L16 13h5" />
      <path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

// ---------- button ----------
type ButtonCommon = {
  /** primary = the page's main action; danger = destructive (outline); dangerSolid = confirm a destructive action */
  variant?: 'default' | 'primary' | 'danger' | 'dangerSolid' | 'ghost';
  size?: 'md' | 'sm';
  /** shows a spinner and disables the button */
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};
type AsButton = ButtonCommon & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };
type AsLink = ButtonCommon & { href: string; target?: string; rel?: string; disabled?: boolean };

/** A button, or a link that looks like one when `href` is given. */
export function Button(props: AsButton | AsLink) {
  const { variant = 'default', size = 'md', loading = false, icon, className, children } = props;
  const classes = cx(css.btn, variant !== 'default' && css[variant], size === 'sm' && css.sm, className);
  const content = (
    <>
      {loading ? <span className={css.spinner} aria-hidden /> : icon}
      {children}
    </>
  );

  if (props.href !== undefined) {
    const { href, target, rel, disabled } = props;
    return (
      <Link href={href} target={target} rel={rel} className={classes} aria-disabled={disabled || loading || undefined}>
        {content}
      </Link>
    );
  }

  const { variant: _v, size: _s, loading: _l, icon: _i, className: _c, children: _ch, href: _h, type = 'button', disabled, ...rest } =
    props;
  return (
    <button {...rest} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>
      {content}
    </button>
  );
}

// ---------- page header ----------
export type Crumb = { label: string; href?: string };

/** Top of every panel page: breadcrumb (from lib/nav.ts), title (+ badges), a short subtitle and the page's buttons. */
export function PageHeader({
  title,
  crumbs,
  subtitle,
  actions,
}: {
  title: ReactNode;
  crumbs?: Crumb[];
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={css.pageHead}>
      <div>
        {crumbs && crumbs.length > 0 && (
          <nav className={css.crumbs} aria-label="مسیر صفحه">
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <span className={css.crumbSep}>‹</span>}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
              </Fragment>
            ))}
          </nav>
        )}
        <h1 className={css.pageTitle}>{title}</h1>
        {subtitle && <p className={css.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={css.pageActions}>{actions}</div>}
    </div>
  );
}

// ---------- card ----------
/** White box with an optional title bar. `flush` drops the inner padding (tables / lists that reach the edges). */
export function Card({
  title,
  description,
  actions,
  flush = false,
  className,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx(css.card, className)}>
      {(title || actions) && (
        <div className={css.cardHead}>
          <div>
            {title && <h2 className={css.cardTitle}>{title}</h2>}
            {description && <p className={css.cardDesc}>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {flush ? children : <div className={css.cardBody}>{children}</div>}
    </section>
  );
}

// ---------- empty state ----------
/** «Nothing here» message: empty tables / searches, «دسترسی ندارید», 404. */
export function EmptyState({
  icon = 'empty',
  title,
  text,
  action,
}: {
  icon?: IconName;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={css.empty}>
      <Icon name={icon} size={40} className={css.emptyIcon} />
      <p className={css.emptyTitle}>{title}</p>
      {text && <p className={css.emptyText}>{text}</p>}
      {action && <div className={css.emptyAction}>{action}</div>}
    </div>
  );
}

// ---------- status badge ----------
export type Tone = 'success' | 'neutral' | 'danger' | 'warning' | 'info';
const TONE: Record<Tone, string> = {
  success: css.success,
  neutral: css.neutral,
  danger: css.dangerTone,
  warning: css.warning,
  info: css.info,
};

/** Small colored pill for a status: فعال (success), غیرفعال (neutral), قفل (danger), … */
export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx(css.badge, TONE[tone])}>{children}</span>;
}
