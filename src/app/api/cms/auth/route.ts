import { z } from 'zod';
import { sessionClient } from '@/lib/cms/client';
import { cmsConfig } from '@/lib/cms/config';
import { failure, readJson } from '@/lib/cms/http';
import { CmsError, verifyAdministrator, verifyOrigin } from '@/lib/cms/security';
const credentials = z.object({action:z.enum(['login','recover','password','logout']),email:z.email().max(254).optional(),password:z.string().max(128).optional()}).strict();
export async function POST(request: Request) {
  try {
    const config=cmsConfig(); if(!config) throw new CmsError('The portal is not configured. Follow the Admin Portal Guide.',503);
    verifyOrigin(request,config.origin);
    const parsed=credentials.safeParse(await readJson(request,2000)); if(!parsed.success) throw new CmsError('Check your email and password.');
    const {action,email,password}=parsed.data; const client=await sessionClient();
    if(action==='logout') {const result=await client.auth.signOut(); if(result.error) throw new CmsError('Sign-out failed. Please try again.',503); return Response.json({ok:true});}
    if(action==='recover') {
      if(!email) throw new CmsError('Enter your email address.');
      const result=await client.auth.resetPasswordForEmail(email,{redirectTo:`${config.origin}/admin/auth/callback`});
      if(result.error) throw new CmsError('The recovery request could not be sent. Please try again later.',503);
      // Do not reveal whether this email has an account or administrator membership.
      return Response.json({ok:true,message:'If this address has an account, a password recovery email will arrive shortly.'});
    }
    if(!password || (action==='password' && password.length<12)) throw new CmsError('Use a password of at least 12 characters.');
    if(action==='login') {
      if(!email) throw new CmsError('Enter your email address.');
      const signed=await client.auth.signInWithPassword({email,password});
      if(signed.error) throw new CmsError('Sign-in failed. Check your email and password.',401);
      try {await verifyAdministrator(client);} catch(error) {await client.auth.signOut(); throw error;}
    } else {
      await verifyAdministrator(client);
      const result=await client.auth.updateUser({password}); if(result.error) throw new CmsError('The password could not be updated. Try a new recovery link.',400);
    }
    return Response.json({ok:true});
  } catch(error) {return failure(error);}
}
