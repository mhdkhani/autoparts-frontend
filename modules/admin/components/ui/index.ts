// The admin panel's own UI kit (Ant Design was tried and rejected — PROJECT-NOTES §2).
// Every panel page is built from these; colors are tokens in styles/global.css.
export { Button, Card, cx, EmptyState, Icon, PageHeader, StatusBadge, type Crumb, type IconName, type Tone } from './base';
export {
  DataTable,
  Pagination,
  queryHref,
  readTableState,
  sortAndPage,
  type Column,
  type SearchParams,
  type TableState,
} from './DataTable';
export { Checkbox, Field, Fieldset, Form, FormActions, FormError, Hint, Input, Select, Spacer, Textarea } from './form';
export { UiProvider, useConfirm, useToast } from './UiProvider';
