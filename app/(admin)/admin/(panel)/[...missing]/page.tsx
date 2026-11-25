import { notFound } from 'next/navigation';

// Any /admin/* URL without a page of its own lands here and gets the admin module's own 404 (../not-found.tsx),
// inside the panel layout and theme — without this, Next would show its default 404 outside the panel.
// A real page for a path always wins over this catch-all.
export default function AdminCatchAll() {
  notFound();
}
