import { NextResponse } from 'next/server';
import { sessionClient } from '@/lib/cms/client';
import { cmsConfig } from '@/lib/cms/config';
import { verifyAdministrator } from '@/lib/cms/security';
export async function GET(request: Request) {
  const config=cmsConfig(); const origin=config?.origin || new URL(request.url).origin;
  try {
    const code=new URL(request.url).searchParams.get('code'); if(!code || !config) throw new Error('invalid recovery');
    const client=await sessionClient(); const result=await client.auth.exchangeCodeForSession(code);
    if(result.error) throw result.error;
    try {await verifyAdministrator(client);} catch(error) {await client.auth.signOut(); throw error;}
    return NextResponse.redirect(`${origin}/admin/reset-password`);
  } catch {return NextResponse.redirect(`${origin}/admin/login?recovery=failed`);}
}
