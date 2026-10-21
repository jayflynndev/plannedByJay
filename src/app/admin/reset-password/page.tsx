import { AuthForm } from '@/components/cms/AuthForm';
import { pageAdmin } from '@/lib/cms/client';
export default async function ResetPassword() {await pageAdmin();return <main id="main-content" className="cms cms-login"><h1>Set your password</h1><p>Use at least 12 characters and choose a password you do not use elsewhere.</p><AuthForm mode="password"/></main>;}
