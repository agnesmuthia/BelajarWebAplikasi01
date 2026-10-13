import type { ProjectFile } from '../data/projects'

/**
 * Content Security Policy untuk dokumen preview:
 * - tidak boleh memuat apa pun dari jaringan (default-src 'none')
 * - hanya CSS/JS inline dan gambar data:/blob: yang diizinkan
 * Dipadukan dengan <iframe sandbox="allow-scripts"> (TANPA allow-same-origin),
 * kode di preview berjalan di origin "kosong" sehingga tidak bisa membaca
 * localStorage, cookie, atau DOM aplikasi DevStudio.
 */
export const PREVIEW_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; form-action 'none'"

/**
 * Di iframe sandbox tanpa allow-same-origin, mengakses localStorage melempar
 * SecurityError. Shim ini menyediakan localStorage di memori agar kode latihan
 * (mis. tombol mode gelap) tetap bisa dicoba — datanya hilang saat preview dimuat ulang.
 */
const STORAGE_SHIM = `(function(){try{window.localStorage.getItem('x')}catch(e){var m={};var s={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}};Object.defineProperty(window,'localStorage',{value:s,configurable:true})}})();`

const escapeScript = (code: string) => code.replace(/<\/script/gi, '<\\/script')
const escapeStyle = (code: string) => code.replace(/<\/style/gi, '<\\/style')

/** Gabungkan index.html + CSS + JS lokal menjadi satu dokumen untuk iframe srcdoc. */
export function buildPreviewDocument(files: ProjectFile[], entry = 'index.html'): string {
  const byPath = new Map(files.map((f) => [f.path, f.content]))
  let html = byPath.get(entry) ?? '<p>index.html tidak ditemukan.</p>'

  html = html.replace(/<link\s+[^>]*href="([^"]+\.css)"[^>]*>/gi, (tag, href: string) => {
    const css = byPath.get(href.replace(/^\.\//, ''))
    return css !== undefined ? `<style>\n${escapeStyle(css)}\n</style>` : tag
  })

  html = html.replace(/<script\s+[^>]*src="([^"]+\.js)"[^>]*>\s*<\/script>/gi, (tag, src: string) => {
    const js = byPath.get(src.replace(/^\.\//, ''))
    return js !== undefined ? `<script>\n${escapeScript(js)}\n</script>` : tag
  })

  return injectHead(html)
}

/** Sisipkan CSP + shim di awal <head> (atau di awal dokumen jika tidak ada <head>). */
export function injectHead(html: string): string {
  const head = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}"><script>${STORAGE_SHIM}</script>`
  if (/<head(\s[^>]*)?>/i.test(html)) return html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}${head}`)
  return head + html
}
