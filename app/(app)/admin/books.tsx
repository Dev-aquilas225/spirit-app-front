/**
 * Redirect — the canonical admin books screen lives at /books/admin.
 * This file exists only because the admin index links to /admin/books.
 */
import { Redirect } from 'expo-router';

export default function AdminBooksRedirect() {
  return <Redirect href="/books/admin" />;
}
