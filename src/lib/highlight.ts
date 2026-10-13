/** Syntax highlighter ringan (tanpa dependensi) untuk HTML, CSS, JS, Bash, dan Markdown. */

export type Lang = 'html' | 'css' | 'js' | 'bash' | 'md' | 'text'
export interface Token { text: string; cls?: string }

type Rule = [RegExp, string]

const RULES: Record<Exclude<Lang, 'text'>, Rule[]> = {
  html: [
    [/<!--[\s\S]*?-->/y, 'tok-comment'],
    [/<!doctype[^>]*>/iy, 'tok-meta'],
    [/<\/?[a-zA-Z][\w-]*/y, 'tok-tag'],
    [/\/?>/y, 'tok-tag'],
    [/\s[a-zA-Z-:@]+(?==)/y, 'tok-attr'],
    [/"[^"]*"|'[^']*'/y, 'tok-string'],
    [/&[a-z]+;/y, 'tok-meta'],
  ],
  css: [
    [/\/\*[\s\S]*?\*\//y, 'tok-comment'],
    [/@[\w-]+/y, 'tok-keyword'],
    [/--[\w-]+/y, 'tok-attr'],
    [/[\w-]+(?=\s*:[^{}]*;)/y, 'tok-attr'],
    [/"[^"]*"|'[^']*'/y, 'tok-string'],
    [/#[0-9a-fA-F]{3,8}\b/y, 'tok-number'],
    [/-?\d*\.?\d+(px|rem|em|%|vh|vw|fr|s|ms|deg|ch)?\b/y, 'tok-number'],
    [/[.#]?[a-zA-Z][\w-]*(?=[^;{}]*\{)/y, 'tok-tag'],
  ],
  js: [
    [/\/\/[^\n]*/y, 'tok-comment'],
    [/\/\*[\s\S]*?\*\//y, 'tok-comment'],
    [/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/y, 'tok-string'],
    [/\b(const|let|var|function|return|if|else|for|while|of|in|new|class|import|export|from|true|false|null|undefined|this|async|await|typeof)\b/y, 'tok-keyword'],
    [/\b\d+(\.\d+)?\b/y, 'tok-number'],
    [/[a-zA-Z_$][\w$]*(?=\()/y, 'tok-fn'],
  ],
  bash: [
    [/#[^\n]*/y, 'tok-comment'],
    [/"[^"]*"|'[^']*'/y, 'tok-string'],
    [/(^|(?<=\n))\s*(git|cd|npm|npx|node|ls|pwd|mkdir|code)\b/y, 'tok-keyword'],
    [/\s--?[\w-]+/y, 'tok-attr'],
  ],
  md: [
    [/^#{1,6} [^\n]*/my, 'tok-keyword'],
    [/`[^`\n]+`/y, 'tok-string'],
    [/\*\*[^*\n]+\*\*/y, 'tok-attr'],
    [/<!--[\s\S]*?-->/y, 'tok-comment'],
  ],
}

export function tokenize(code: string, lang: Lang): Token[] {
  if (lang === 'text') return [{ text: code }]
  const rules = RULES[lang]
  const out: Token[] = []
  let plain = ''
  let i = 0
  outer: while (i < code.length) {
    for (const [re, cls] of rules) {
      re.lastIndex = i
      const m = re.exec(code)
      if (m && m.index === i && m[0].length > 0) {
        if (plain) {
          out.push({ text: plain })
          plain = ''
        }
        out.push({ text: m[0], cls })
        i += m[0].length
        continue outer
      }
    }
    plain += code[i]
    i++
  }
  if (plain) out.push({ text: plain })
  return out
}

export function langFromPath(path: string): Lang {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'html') return 'html'
  if (ext === 'css') return 'css'
  if (ext === 'js' || ext === 'ts') return 'js'
  if (ext === 'md') return 'md'
  if (ext === 'sh') return 'bash'
  return 'text'
}
