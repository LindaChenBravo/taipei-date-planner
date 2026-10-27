import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

const output=process.argv[2];
if(!output)throw new Error('請提供單檔 HTML 的輸出路徑。');
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
let html=read('index.html');
const replacements=[
  ['<link rel="stylesheet" href="./style.css" />',`<style>\n${read('style.css')}</style>`],
  ...['data/spots.js','data/routes.js','app.js'].map(path=>[`<script src="./${path}"></script>`,`<script>\n${read(path)}</script>`])
];
for(const [tag,inline] of replacements){
  if(!html.includes(tag))throw new Error(`找不到 ${tag}`);
  html=html.replace(tag,inline);
}
const path=resolve(output);
mkdirSync(dirname(path),{recursive:true});
writeFileSync(path,html);
console.log(`已建立 ${path}`);
