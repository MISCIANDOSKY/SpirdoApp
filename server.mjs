import http from 'node:http';
import {readFile,writeFile,mkdir,rename,unlink} from 'node:fs/promises';
import {randomBytes,scryptSync,timingSafeEqual,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const data=process.env.DATA_DIR||path.join(root,'data');await mkdir(data,{recursive:true});
if(!process.env.ADMIN_CODE)throw new Error('Configura la variabile ADMIN_CODE prima di avviare il server.');
const salt=randomBytes(16),codeHash=scryptSync(process.env.ADMIN_CODE,salt,32);
const sessions=new Map(),attempts=new Map();let mutations=Promise.resolve();
async function catalog(){try{return JSON.parse(await readFile(path.join(data,'sounds.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return [];throw e}}
async function save(list){const temp=path.join(data,'sounds.tmp');await writeFile(temp,JSON.stringify(list));await rename(temp,path.join(data,'sounds.json'))}
function auth(req){const token=/\bsuoni_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];const expires=sessions.get(token);if(expires>Date.now())return token;sessions.delete(token);return null}
function send(res,status,value,headers={}){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(value))}
async function body(req,max){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw Object.assign(new Error('File troppo grande (massimo 20 MB).'),{status:413});chunks.push(chunk)}return Buffer.concat(chunks)}
const formats={mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',ogg:'audio/ogg',aac:'audio/aac',flac:'audio/flac'};
export async function handleRequest(req,res){try{
 const url=new URL(req.url,'http://localhost'),p=url.pathname,method=req.method;
 if(!['GET','HEAD'].includes(method)&&req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)return send(res,403,{error:'Origine non consentita.'})}
 if(p==='/api/session'&&method==='GET')return send(res,200,{admin:!!auth(req)});
 if(p==='/api/login'&&method==='POST'){
  const ip=req.socket.remoteAddress;let a=attempts.get(ip);if(!a||a.until<Date.now())a={count:0,until:Date.now()+15*60e3};if(a.count>=5)return send(res,429,{error:'Troppi tentativi. Riprova tra 15 minuti.'});
  const input=JSON.parse((await body(req,1024)).toString());const hash=scryptSync(String(input.code||''),salt,32);
  if(!timingSafeEqual(hash,codeHash)){a.count++;attempts.set(ip,a);return send(res,401,{error:'Codice non corretto.'})}
  attempts.delete(ip);for(const [token,expiry]of sessions)if(expiry<Date.now())sessions.delete(token);
  const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600e3);
  return send(res,200,{admin:true},{'Set-Cookie':`suoni_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`});
 }
 if(p==='/api/logout'&&method==='POST'){sessions.delete(auth(req));return send(res,200,{admin:false},{'Set-Cookie':'suoni_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})}
 if(p==='/api/sounds'&&method==='GET')return send(res,200,await catalog());
 if(p.startsWith('/api/sounds')&& !['GET','HEAD'].includes(method)){
  if(!auth(req))return send(res,401,{error:'Inserisci il codice amministratore.'});
  const operation=async()=>{
   const list=await catalog();
   if(p==='/api/sounds'&&method==='POST'){
    const name=decodeURIComponent(req.headers['x-file-name']||'suono.mp3').slice(0,200),ext=name.split('.').pop().toLowerCase();if(!formats[ext])return send(res,400,{error:'Formato audio non supportato.'});
    const bytes=await body(req,20*1024*1024);if(!bytes.length)return send(res,400,{error:'Il file è vuoto.'});const id=randomUUID();await writeFile(path.join(data,id),bytes);const item={id,name,label:name.replace(/\.[^.]+$/,'').slice(0,80),type:formats[ext],url:'/audio/'+id};list.push(item);await save(list);return send(res,201,item);
   }
   const id=p.split('/')[3],index=list.findIndex(s=>s.id===id);if(index<0)return send(res,404,{error:'Suono non trovato.'});
   if(method==='PATCH'){const input=JSON.parse((await body(req,2048)).toString());const label=String(input.label||'').trim().slice(0,80);if(!label)return send(res,400,{error:'Inserisci un’etichetta.'});list[index].label=label;await save(list);return send(res,200,list[index])}
   if(method==='DELETE'){list.splice(index,1);await save(list);await unlink(path.join(data,id)).catch(()=>{});return send(res,200,{ok:true})}
   send(res,405,{error:'Operazione non supportata.'});
  };const current=mutations.then(operation);mutations=current.catch(()=>{});await current;return;
 }
 if(p.startsWith('/audio/')&&method==='GET'){const item=(await catalog()).find(s=>s.url===p);if(!item)return send(res,404,{error:'Suono non trovato.'});const bytes=await readFile(path.join(data,item.id));res.writeHead(200,{'Content-Type':item.type,'Content-Length':bytes.length,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});res.end(bytes);return}
 const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/icon.svg':'icon.svg','/icon-192.png':'icon-192.png','/icon-512.png':'icon-512.png'};
 if(!files[p]||!['GET','HEAD'].includes(method))return send(res,404,{error:'Non trovato.'});const ext=files[p].split('.').pop(),types={html:'text/html; charset=utf-8',js:'text/javascript',css:'text/css',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png'};const bytes=await readFile(path.join(root,'dist',files[p]));res.writeHead(200,{'Content-Type':types[ext],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(method==='HEAD'?undefined:bytes);
 }catch(e){send(res,e.status||400,{error:e.status?e.message:'Operazione non riuscita.'})}}
const server=http.createServer(handleRequest);
if(process.env.NODE_ENV!=='test')server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Suoni: server avviato'));
