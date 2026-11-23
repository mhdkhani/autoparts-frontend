import Link from 'next/link';
import type { ConfigSectionInfo } from '@admin/lib/types';
import css from './config.module.css';

/** Side list of the settings page: sections under their category heading (عمومی، سئو، …). */
export default function ConfigSideNav({ sections, active }: { sections: ConfigSectionInfo[]; active: string }) {
  const categories = [...new Set(sections.map((s) => s.category))];
  return (
    <nav className={css.side} aria-label="بخش‌های تنظیمات">
      {categories.map((c) => (
        <div key={c}>
          <div className={css.category}>{c}</div>
          {sections
            .filter((s) => s.category === c)
            .map((s) => (
              <Link
                key={s.key}
                href={`/admin/system/config/${s.key}`}
                className={`${css.sectionLink} ${s.key === active ? css.sectionActive : ''}`}
                aria-current={s.key === active ? 'page' : undefined}
              >
                {s.label}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
}
