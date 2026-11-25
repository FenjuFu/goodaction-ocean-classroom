import {readFile} from 'node:fs/promises';
export const english=JSON.parse(await readFile(new URL('../locales/en.json',import.meta.url),'utf8'));
const keys=Object.keys(english).sort((a,b)=>b.length-a.length);
const pattern=new RegExp(keys.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
export function toEnglish(text){return text.replace(pattern,key=>english[key]);}
