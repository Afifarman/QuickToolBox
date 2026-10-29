import { redirect } from 'next/navigation';

// QuickToolBox is designed for public, no-login tool access.
export default function LoginPage() {
  redirect('/');
}
