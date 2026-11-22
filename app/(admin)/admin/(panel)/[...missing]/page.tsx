import { notFound } from 'next/navigation';

// Unknown /admin/* URLs → the admin module's own 404, inside the admin theme.
export default function AdminCatchAll() {
  notFound();
}
