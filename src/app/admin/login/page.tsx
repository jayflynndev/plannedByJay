import { AuthForm } from '@/components/cms/AuthForm';
import { cmsConfig } from '@/lib/cms/config';
export default async function Login({searchParams}:{searchParams:Promise<{recovery?:string}>}) {
  const params=await searchParams;
  return <main id="main-content" className="cms cms-login"><p className="eyebrow">Planned by Jay</p><h1>Content portal</h1>
    <p>Sign in to create and manage your travel articles.</p>
    {params.recovery==='failed' && <p role="alert" className="cms-error">The recovery link has expired or could not be verified. Request a new link and open it in the same browser.</p>}
    {cmsConfig()?<AuthForm/>:<p className="cms-notice">The portal is awaiting setup. Follow docs/ADMIN-PORTAL-GUIDE.md to configure authentication, the CMS migrations and image storage.</p>}
  </main>;
}
