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

// ---------- catalog › attributes (backend: src/modules/catalog/attributes) ----------

/** Attribute types with their panel labels (backend list: ATTRIBUTE_TYPES in attribute.schema.ts). */
export const ATTRIBUTE_TYPES = [
  { value: 'text', label: 'متن کوتاه' },
  { value: 'textarea', label: 'متن بلند' },
  { value: 'int', label: 'عدد صحیح' },
  { value: 'decimal', label: 'عدد اعشاری' },
  { value: 'boolean', label: 'بله / خیر' },
  { value: 'date', label: 'تاریخ' },
  { value: 'select', label: 'یک انتخاب از فهرست' },
  { value: 'multiselect', label: 'چند انتخاب از فهرست' },
] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number]['value'];
export const attributeTypeLabel = (t: AttributeType): string => ATTRIBUTE_TYPES.find((x) => x.value === t)!.label;

// same groups as the backend's attribute.schema.ts
export const OPTION_TYPES: readonly AttributeType[] = ['select', 'multiselect'];
export const NUMERIC_TYPES: readonly AttributeType[] = ['int', 'decimal'];
export const TEXT_TYPES: readonly AttributeType[] = ['text', 'textarea'];
export const FILTERABLE_TYPES: readonly AttributeType[] = ['int', 'decimal', 'boolean', 'select', 'multiselect'];

export type Attribute = {
  id: number;
  code: string;
  labelFa: string;
  labelEn: string | null;
  dataType: AttributeType;
  unit: string | null;
  validation: { min?: number; max?: number; maxLength?: number };
  helpText: string | null;
  isFilterable: boolean;
  isSearchable: boolean;
  createdAt: string;
  updatedAt: string;
};
export type AttributeListItem = Attribute & { optionCount: number; setCount: number };
/** `code`: stable English key (fixed after creation) */
export type AttributeOption = { id: number; code: string; labelFa: string; labelEn: string | null };
export type AttributeDetail = Attribute & { options: AttributeOption[] };

export type AttributeSetListItem = { id: number; name: string; groupCount: number; attributeCount: number };
export type AttributeSet = {
  id: number;
  name: string;
  groups: { id: number; name: string; attributes: { attributeId: number; isRequired: boolean }[] }[];
};
