import {readdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
export async function buildCatalog(directory=root){
 const audio=path.join(directory,'audio');let labels={};
 try{labels=JSON.parse(await readFile(path.join(audio,'labels.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
 const entries=await readdir(audio,{withFileTypes:true});
 const sounds=entries.filter(e=>e.isFile()&&/\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i.test(e.name)).sort((a,b)=>a.name.localeCompare(b.name,'it')).map(e=>({name:e.name,label:typeof labels[e.name]==='string'&&labels[e.name].trim()?labels[e.name].trim():e.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '),url:'./audio/'+encodeURIComponent(e.name)}));
 await writeFile(path.join(directory,'sounds.json'),JSON.stringify(sounds,null,2)+'\n');return sounds;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){console.log((await buildCatalog()).length+' suoni pronti')}
