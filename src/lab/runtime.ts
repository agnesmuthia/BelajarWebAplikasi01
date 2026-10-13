import { protectLoops } from './loopProtect'

export interface LabFiles {
  html: string
  css: string
  js: string
}

export type LabFileKey = keyof LabFiles

export const LAB_FILE_NAMES: Record<LabFileKey, string> = {
  html: 'index.html',
  css: 'style.css',
  js: 'script.js',
}

/** Alat bantu yang diterima setiap fungsi pemeriksa (berjalan DI DALAM iframe). */
export interface CheckHelpers {
  $: (selector: string) => HTMLElement | null
  $$: (selector: string) => HTMLElement[]
  /** Nilai computed style, mis. css(el, 'background-color'). */
  css: (el: Element | null, prop: string) => string
  text: (el: Element | null) => string | null
  click: (el: Element | null) => void
  type: (el: Element | null, value: string) => void
  submit: (form: Element | null) => void
  wait: (ms: number) => Promise<void>
  /** Semua teks yang sudah dicetak console.log/info/warn/error. */
  logs: () => string[]
  /** Error JavaScript yang sudah terjadi. */
  errors: () => string[]
}

export type CheckResult = boolean | { pass: boolean; actual?: string }

export interface CheckDef {
  id: string
  label: string
  expected: string
  /** Fungsi mandiri — tidak boleh memakai variabel dari luar. Dikirim ke iframe sebagai teks. */
  test: (h: CheckHelpers) => CheckResult | Promise<CheckResult>
}

/**
 * CSP untuk Coding Lab: kode tidak bisa melakukan fetch/XHR/WebSocket (connect-src default 'none'),
 * tetapi boleh menampilkan gambar & font dari https agar latihan terasa nyata.
 */
export const LAB_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com data:',
  'img-src https: data: blob:',
  'media-src https: data: blob:',
  "form-action 'none'",
].join('; ')

export const LAB_SANDBOX = 'allow-scripts allow-forms'

export interface MappedLine {
  file: LabFileKey
  line: number
}

export interface BuiltDocument {
  html: string
  /** Petakan nomor baris dokumen gabungan → file & baris asli. */
  mapLine: (docLine: number) => MappedLine | null
  linksCss: boolean
  linksJs: boolean
}

const RE_INLINE_SCRIPT = /(<script\b(?![^>]*\bsrc\s*=)[^>]*>)([\s\S]*?)(<\/script\s*>)/gi

const escapeScript = (s: string) => s.replace(/<\/script/gi, '<\\/script')
const escapeStyle = (s: string) => s.replace(/<\/style/gi, '<\\/style')

/**
 * Skrip runtime yang disuntikkan ke <head>: menangkap console & error, mengganti alert/prompt,
 * menyediakan guard loop, dan menjalankan pemeriksa. Ditulis tanpa komentar `//` karena
 * semua baris digabung menjadi SATU baris (agar nomor baris kode pengguna tidak bergeser).
 */
function runtimeScript(token: string, capture: boolean): string {
  const src = `
(function(){
var T=${JSON.stringify(token)};var CAP=${capture ? 'true' : 'false'};
var logs=[];var errs=[];var sent=0;
function P(m){if(!CAP)return;if(m.type==='console'||m.type==='error'){sent++;if(sent>500)return;}m.source='devstudio-lab';m.token=T;try{parent.postMessage(m,'*');}catch(e){}}
function fmt(v,d){d=d||0;try{
if(v===null)return 'null';if(v===undefined)return 'undefined';var t=typeof v;
if(t==='string')return d?JSON.stringify(v):v;
if(t==='number'||t==='boolean'||t==='bigint')return String(v);
if(t==='function')return 'ƒ '+(v.name||'anonim')+'()';
if(t==='symbol')return v.toString();
if(v instanceof Error)return v.name+': '+v.message;
if(typeof Element!=='undefined'&&v instanceof Element){var cn=typeof v.className==='string'&&v.className.trim()?'.'+v.className.trim().split(/\\s+/).join('.'):'';return '<'+v.tagName.toLowerCase()+(v.id?'#'+v.id:'')+cn+'>';}
if(typeof NodeList!=='undefined'&&(v instanceof NodeList||v instanceof HTMLCollection)){return (v instanceof NodeList?'NodeList':'HTMLCollection')+'('+v.length+') ['+Array.prototype.slice.call(v,0,20).map(function(x){return fmt(x,d+1);}).join(', ')+']';}
if(d>2)return Array.isArray(v)?'[…]':'{…}';
if(Array.isArray(v))return '['+v.slice(0,50).map(function(x){return fmt(x,d+1);}).join(', ')+(v.length>50?', …':'')+']';
var ks=Object.keys(v);return '{'+ks.slice(0,30).map(function(k){return k+': '+fmt(v[k],d+1);}).join(', ')+(ks.length>30?', …':'')+'}';
}catch(e){return String(v);}}
function out(level,args){var s=Array.prototype.map.call(args,function(a){return fmt(a,0);}).join(' ');if(s.length>4000)s=s.slice(0,4000)+'…';logs.push(s);P({type:'console',level:level,text:s});}
['log','info','warn','error','debug'].forEach(function(l){console[l]=function(){out(l==='debug'?'log':l,arguments);};});
console.table=function(){out('log',arguments);};
console.clear=function(){P({type:'clear'});};
window.alert=function(m){out('info',['[alert] '+(m===undefined?'':m)]);};
window.confirm=function(m){out('info',['[confirm] '+(m===undefined?'':m)+' → otomatis dijawab true di preview']);return true;};
window.prompt=function(m,d){out('info',['[prompt] '+(m===undefined?'':m)+' → mengembalikan '+JSON.stringify(d===undefined?'':String(d))]);return d===undefined?'':String(d);};
var lp={},lt={},sch=false;
window.__dsLoop=function(id,f,ln){lp[id]=(lp[id]||0)+1;if(!sch){sch=true;setTimeout(function(){lp={};lt={};sch=false;},0);}
if(lp[id]>5000){if(!lt[id])lt[id]=Date.now();else if(Date.now()-lt[id]>1000){lp[id]=0;lt[id]=0;var er=new Error('Loop berjalan lebih dari 1 detik dan dihentikan (kemungkinan infinite loop).');er.__dsLoc={file:f,line:ln};throw er;}}};
window.addEventListener('error',function(e){
if(e.target&&e.target!==window&&e.target.tagName){var el=e.target;P({type:'resource',text:'Gagal memuat <'+el.tagName.toLowerCase()+'> '+(el.getAttribute('src')||el.getAttribute('href')||'')});return;}
var msg=e.message||'Error';errs.push(msg);P({type:'error',text:msg,line:e.lineno||0,col:e.colno||0,loc:e.error&&e.error.__dsLoc?e.error.__dsLoc:null});},true);
document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a||e.defaultPrevented)return;var h=a.getAttribute('href')||'';if(!h||h.charAt(0)==='#'||/^(mailto|tel|javascript):/i.test(h))return;e.preventDefault();if(/^[a-z][a-z0-9+.-]*:|^\\/\\//i.test(h)){out('info',['Link eksternal tidak dibuka di dalam preview: '+h]);return;}P({type:'navigate',href:h});});
window.addEventListener('submit',function(e){if(!e.defaultPrevented){e.preventDefault();out('warn',['Form dikirim tanpa event.preventDefault(). Di website sungguhan, halaman akan dimuat ulang (Lab mencegahnya).']);}});
window.addEventListener('unhandledrejection',function(e){var r=e.reason;var msg='Promise ditolak: '+(r&&r.message?r.message:fmt(r,0));errs.push(msg);P({type:'error',text:msg,line:0,col:0});});
var CHECKS=[];window.__dsSetChecks=function(c){CHECKS=c;};
var H={
$:function(s){return document.querySelector(s);},
$$:function(s){return Array.prototype.slice.call(document.querySelectorAll(s));},
css:function(el,p){return el?getComputedStyle(el).getPropertyValue(p).trim():'';},
text:function(el){return el?(el.textContent||'').replace(/\\s+/g,' ').trim():null;},
click:function(el){if(el)el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));},
type:function(el,v){if(!el)return;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},
submit:function(f){if(!f)return;if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));},
wait:function(ms){return new Promise(function(r){setTimeout(r,ms);});},
logs:function(){return logs.slice();},
errors:function(){return errs.slice();}
};
function timeout(ms){return new Promise(function(_,rej){setTimeout(function(){rej(new Error('Pemeriksaan terlalu lama'));},ms);});}
async function runChecks(){var res=[];for(var i=0;i<CHECKS.length;i++){var c=CHECKS[i];try{var r=await Promise.race([Promise.resolve().then(function(){return c.fn(H);}),timeout(2500)]);
if(typeof r==='boolean')res.push({id:c.id,pass:r});else res.push({id:c.id,pass:!!(r&&r.pass),actual:r&&r.actual!==undefined?String(r.actual):undefined});}
catch(e){res.push({id:c.id,pass:false,actual:'Error saat memeriksa: '+(e&&e.message?e.message:e)});}}
P({type:'checks',results:res});}
window.addEventListener('load',function(){P({type:'ready'});if(CHECKS.length)setTimeout(runChecks,80);});
})();`
  return src.replace(/\n/g, '')
}

/** Pemeriksa disisipkan di AKHIR dokumen, jadi boleh multi-baris tanpa menggeser nomor baris. */
function checksScript(checks: CheckDef[]): string {
  if (!checks.length) return ''
  const items = checks.map((c) => `{id:${JSON.stringify(c.id)},fn:(${escapeScript(String(c.test))})}`).join(',\n')
  return `\n<script>window.__dsSetChecks([${items}]);</script>`
}

interface Seg {
  text: string
  file: string
  /** Nomor baris (di file asal) tempat segmen ini dimulai. */
  startLine: number
}

const countLines = (s: string) => s.split('\n').length - 1

export interface DocLocation {
  file: string
  line: number
}

export interface BuildInput {
  /** Path halaman HTML yang dirender, mis. "index.html" atau "pages/kontak.html". */
  entry: string
  /** File teks proyek: path → isi. */
  texts: Map<string, string>
  /** Aset biner proyek: path → data URL. */
  assets?: Map<string, string>
  token?: string
  checks?: CheckDef[]
  capture?: boolean
}

export interface BuildResult {
  html: string
  mapLine: (docLine: number) => DocLocation | null
  /** Referensi ke file lokal yang tidak ada di proyek. */
  missing: { from: string; ref: string }[]
  linkedCss: string[]
  linkedJs: string[]
}

const RE_LINK_TAG = /<link\b[^>]*>/gi
const RE_SCRIPT_SRC = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script\s*>/gi
const attr = (tag: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(tag)?.[1]

function dirOf(path: string) {
  const i = path.lastIndexOf('/')
  return i === -1 ? '' : path.slice(0, i)
}

/** Resolusi path relatif dari folder `dir`; null untuk URL eksternal, data:, atau anchor. */
export function resolveRef(dir: string, ref: string): string | null {
  const clean = ref.split(/[?#]/)[0].trim()
  if (!clean || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(clean)) return null
  const stack = clean.startsWith('/') || !dir ? [] : dir.split('/')
  for (const seg of clean.replace(/^\/+/, '').split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      if (!stack.length) return null
      stack.pop()
    } else {
      try {
        stack.push(decodeURIComponent(seg))
      } catch {
        stack.push(seg)
      }
    }
  }
  return stack.join('/') || null
}

/**
 * Gabungkan satu halaman HTML beserta CSS, JS, dan aset lokal yang dirujuknya menjadi
 * satu dokumen untuk iframe srcdoc. Jumlah baris setiap file dipertahankan, sehingga
 * nomor baris error bisa dipetakan kembali ke file & baris aslinya.
 */
export function buildDocument(input: BuildInput): BuildResult {
  const { entry, texts } = input
  const assets = input.assets ?? new Map<string, string>()
  const missing: BuildResult['missing'] = []
  const linkedCss: string[] = []
  const linkedJs: string[] = []
  const entryDir = dirOf(entry)
  const source = texts.get(entry) ?? `<p>${entry} tidak ditemukan.</p>`
  const noteMissing = (from: string, ref: string) => {
    if (!missing.some((m) => m.from === from && m.ref === ref)) missing.push({ from, ref })
  }

  /** Ganti url(...) yang menunjuk aset proyek dengan data URL (tidak menambah baris). */
  const rewriteCss = (css: string, from: string) =>
    css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, _q: string, ref: string) => {
      const p = resolveRef(dirOf(from), ref)
      if (!p) return m
      const data = assets.get(p)
      if (data) return `url("${data}")`
      if (!texts.has(p)) noteMissing(from, ref)
      return m
    })

  /** Ganti src/href/poster yang menunjuk aset proyek dengan data URL. */
  const rewriteHtml = (html: string) =>
    rewriteCss(
      html.replace(/(\s(?:src|href|poster)\s*=\s*)(["'])([^"']*)\2/gi, (m, pre: string, q: string, ref: string) => {
        const p = resolveRef(entryDir, ref)
        if (!p) return m
        const data = assets.get(p)
        if (data) return `${pre}${q}${data}${q}`
        if (!texts.has(p)) noteMissing(entry, ref)
        return m
      }),
      entry,
    )

  // 1. Lindungi loop di <script> inline (jumlah baris tetap).
  const html = source.replace(RE_INLINE_SCRIPT, (_m, open: string, body: string, close: string, offset: number) => {
    const lineOffset = source.slice(0, offset + open.length).split('\n').length - 1
    return open + escapeScript(protectLoops(body, { file: entry, lineOffset })) + close
  })

  const head = `<meta http-equiv="Content-Security-Policy" content="${LAB_CSP}"><script>${runtimeScript(input.token ?? '', input.capture ?? true)}</script>`

  // 2. Kumpulkan posisi yang perlu diganti / disisipi.
  type Edit = { at: number; len: number; kind: 'head' } | { at: number; len: number; kind: 'css' | 'js'; path: string }
  const edits: Edit[] = []
  const headMatch = /<head(\s[^>]*)?>/i.exec(html) ?? /<!doctype[^>]*>/i.exec(html)
  edits.push({ at: headMatch ? headMatch.index + headMatch[0].length : 0, len: 0, kind: 'head' })
  for (const m of html.matchAll(RE_LINK_TAG)) {
    const rel = attr(m[0], 'rel')
    const href = attr(m[0], 'href')
    if (!href || !/\bstylesheet\b/i.test(rel ?? '')) continue
    const p = resolveRef(entryDir, href)
    if (!p) continue
    if (texts.has(p)) edits.push({ at: m.index!, len: m[0].length, kind: 'css', path: p })
    else noteMissing(entry, href)
  }
  for (const m of html.matchAll(RE_SCRIPT_SRC)) {
    const p = resolveRef(entryDir, m[1])
    if (!p) continue
    if (texts.has(p)) edits.push({ at: m.index!, len: m[0].length, kind: 'js', path: p })
    else noteMissing(entry, m[1])
  }
  edits.sort((a, b) => a.at - b.at)

  const segs: Seg[] = []
  let cursor = 0
  let htmlLine = 1
  const pushHtml = (end: number) => {
    const text = rewriteHtml(html.slice(cursor, end))
    segs.push({ text, file: entry, startLine: htmlLine })
    htmlLine += countLines(html.slice(cursor, end))
    cursor = end
  }

  for (const e of edits) {
    if (e.at < cursor) continue
    pushHtml(e.at)
    const consumed = html.slice(e.at, e.at + e.len)
    if (e.kind === 'head') segs.push({ text: head, file: entry, startLine: htmlLine })
    else {
      const content = texts.get(e.path) ?? ''
      const isCss = e.kind === 'css'
      ;(isCss ? linkedCss : linkedJs).push(e.path)
      segs.push({ text: isCss ? '<style>' : '<script>', file: entry, startLine: htmlLine })
      segs.push({
        text: '\n' + (isCss ? escapeStyle(rewriteCss(content, e.path)) : escapeScript(protectLoops(content, { file: e.path }))),
        file: e.path,
        startLine: 0,
      })
      htmlLine += countLines(consumed)
      segs.push({ text: isCss ? '</style>' : '</script>', file: entry, startLine: htmlLine })
    }
    cursor = e.at + e.len
  }
  pushHtml(html.length)
  segs.push({ text: checksScript(input.checks ?? []), file: entry, startLine: htmlLine })

  // 3. Peta baris: setiap baris dokumen dimiliki segmen tempat baris itu DIMULAI.
  const lineMap: DocLocation[] = [{ file: entry, line: 1 }, { file: entry, line: 1 }]
  for (const s of segs) {
    let k = 0
    for (let i = 0; i < s.text.length; i++) {
      if (s.text[i] === '\n') {
        k++
        lineMap.push({ file: s.file, line: s.startLine + k })
      }
    }
  }

  return { html: segs.map((s) => s.text).join(''), mapLine: (l) => lineMap[l] ?? null, missing, linkedCss, linkedJs }
}

/* -------------------- Coding Lab: tiga file tetap -------------------- */

const PATH_TO_KEY: Record<string, LabFileKey> = { 'index.html': 'html', 'style.css': 'css', 'script.js': 'js' }

export function labKeyFromPath(path: string): LabFileKey | null {
  return PATH_TO_KEY[path] ?? null
}

export function buildLabDocument(files: LabFiles, opts: { token?: string; checks?: CheckDef[]; capture?: boolean } = {}): BuiltDocument {
  const texts = new Map([
    ['index.html', files.html],
    ['style.css', files.css],
    ['script.js', files.js],
  ])
  const r = buildDocument({ entry: 'index.html', texts, ...opts })
  return {
    html: r.html,
    mapLine: (l) => {
      const m = r.mapLine(l)
      const key = m && labKeyFromPath(m.file)
      return m && key ? { file: key, line: m.line } : null
    },
    linksCss: r.linkedCss.includes('style.css'),
    linksJs: r.linkedJs.includes('script.js'),
  }
}
