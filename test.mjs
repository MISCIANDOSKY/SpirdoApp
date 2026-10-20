import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {Readable} from 'node:stream';
process.env.NODE_ENV='test';process.env.ADMIN_CODE='test-admin-code';process.env.DATA_DIR=await mkdtemp(path.join(os.tmpdir(),'suoni-test-'));
const {handleRequest}=await import('./server.mjs');
async function call(url,method='GET',body='',cookie='',extra={}){const req=Readable.from(body?[Buffer.from(body)]:[]);Object.assign(req,{url,method,headers:{host:'localhost',cookie,...extra},socket:{remoteAddress:'test'}});let status,headers;const result=await new Promise((resolve,reject)=>{handleRequest(req,{writeHead(s,h){status=s;headers=h},end(value){resolve({status,headers,body:Buffer.isBuffer(value)?value.toString():value})}}).catch(reject)});return result}
try{
 assert.equal((await call('/api/sounds','POST','a')).status,401);
 assert.equal((await call('/api/login','POST','{"code":"bad"}')).status,401);
 const login=await call('/api/login','POST','{"code":"test-admin-code"}');assert.equal(login.status,200);const cookie=login.headers['Set-Cookie'].split(';')[0];assert.match(login.headers['Set-Cookie'],/HttpOnly/);
 let r=await call('/api/sounds','POST','RIFFtest',cookie,{'x-file-name':'campana.wav'});assert.equal(r.status,201);const item=JSON.parse(r.body);
 assert.equal(JSON.parse((await call('/api/sounds')).body).length,1);
 assert.equal((await call(item.url)).body,'RIFFtest');
 for(const method of ['PATCH','DELETE'])assert.equal((await call('/api/sounds/'+item.id,method,'{"label":"X"}')).status,401);
 assert.equal((await call('/api/sounds/'+item.id,'PATCH','{"label":"Campanello"}',cookie)).status,200);
 assert.equal(JSON.parse((await call('/api/sounds')).body)[0].label,'Campanello');
 assert.equal((await call('/api/sounds','POST','a',cookie,{origin:'https://altro.test'})).status,403);
 assert.equal((await call('/api/logout','POST','',cookie)).status,200);
 assert.equal((await call('/api/sounds/'+item.id,'DELETE','',cookie)).status,401);
 const next=await call('/api/login','POST','{"code":"test-admin-code"}');const nextCookie=next.headers['Set-Cookie'].split(';')[0];assert.equal((await call('/api/sounds/'+item.id,'DELETE','',nextCookie)).status,200);assert.equal((await call(item.url)).status,404);
 for(let i=0;i<5;i++)assert.equal((await call('/api/login','POST','{"code":"bad"}')).status,401);assert.equal((await call('/api/login','POST','{"code":"bad"}')).status,429);
 assert.equal((await call('/app.js')).body.includes('test-admin-code'),false);
 console.log('OK: autorizzazione server, ascolto ospiti, etichette, caricamento, rimozione, uscita, origine, limite tentativi e codice non esposto.');
}finally{await rm(process.env.DATA_DIR,{recursive:true,force:true})}
