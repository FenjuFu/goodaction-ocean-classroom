import {createHmac} from 'node:crypto';
import worker from '../worker/index.js';

// Vercel overwrites x-forwarded-for. Never trust a caller-supplied OAI identity.
export default {async fetch(request){
 const headers=new Headers(request.headers);
 for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-'))headers.delete(key);
 const ip=headers.get('x-forwarded-for')?.split(',')[0]?.trim();
 if(!ip&&new URL(request.url).pathname!=='/api/status')return Response.json({error:'Client address is unavailable. Please retry.'},{status:503});
 const dailyKey=new Date().toISOString().slice(0,10);
 const uid=createHmac('sha256',process.env.PUBLIC_RATE_LIMIT_SALT||'blue-ocean-public').update(dailyKey+':'+(ip||'status')).digest('hex').slice(0,32);
 headers.set('oai-authenticated-user-id','public-'+uid);
 const forwarded=new Request(request,{headers});
 return worker.fetch(forwarded,process.env,{});
}};
