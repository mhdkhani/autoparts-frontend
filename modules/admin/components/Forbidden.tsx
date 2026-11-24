import { Button, Card, EmptyState, PageHeader } from './ui';

/** Shown on a panel page the admin's role has no permission for. */
export default function Forbidden() {
  return (
    <>
      <PageHeader title="دسترسی ندارید" />
      <Card flush>
        <EmptyState
          icon="lock"
          title="نقش کاربری شما به این بخش دسترسی ندارد."
          text="اگر لازم است، از مدیر سایت بخواهید دسترسی بدهد."
          action={<Button href="/admin">بازگشت به داشبورد</Button>}
        />
      </Card>
    </>
  );
}
