import { notFound } from 'next/navigation';

// Unknown public URLs → the front module's own 404 (app/(front)/not-found.tsx),
// rendered inside the front layout.
export default function FrontCatchAll() {
  notFound();
}
