/** Shown on a panel page the admin's role has no permission for. */
export default function Forbidden() {
  return (
    <>
      <h1>دسترسی ندارید</h1>
      <p>نقش کاربری شما به این بخش دسترسی ندارد. اگر لازم است، از مدیر سایت بخواهید دسترسی بدهد.</p>
      <p>
        <a href="/admin" style={{ color: '#2563eb' }}>
          بازگشت به داشبورد
        </a>
      </p>
    </>
  );
}
