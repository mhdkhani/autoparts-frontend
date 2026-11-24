// Shapes returned by the backend admin API (backend: src/modules/users/admin).

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  /** set only while the account is locked */
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: number; name: string };
};

export type AdminRole = {
  id: number;
  name: string;
  allPermissions: boolean;
  /** permission keys as stored by the backend (the panel's own list is `Permission` in lib/nav.ts) */
  permissions: string[];
  userCount?: number;
};

export type PermissionInfo = { key: string; group: string; label: string };

// ---------- site settings (backend: src/modules/site-config/config.definition.ts) ----------

export type ConfigField = {
  key: string;
  type: 'text' | 'textarea' | 'image' | 'boolean' | 'select';
  label: string;
  comment?: string;
  default: string;
  maxLength?: number;
  /** checked by the backend on save */
  pattern?: string;
  patternMessage?: string;
  /** left-to-right input */
  ltr?: boolean;
  options?: { value: string; label: string }[];
};

export type ConfigGroup = { key: string; label: string; description?: string; fields: ConfigField[] };
export type ConfigSection = { key: string; category: string; label: string; groups: ConfigGroup[] };
export type ConfigSectionInfo = Pick<ConfigSection, 'key' | 'category' | 'label'>;
/** "<section>/<group>/<field>" → value */
export type ConfigValues = Record<string, string>;
