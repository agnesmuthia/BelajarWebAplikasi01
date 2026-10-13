export type FormatLang = 'html' | 'css' | 'js' | 'json' | 'md'

export const canFormat = (lang: string): lang is FormatLang => ['html', 'css', 'js', 'json', 'md'].includes(lang)

/** Format kode dengan Prettier. Dimuat hanya saat tombol Format ditekan (±400 KB). */
export async function formatCode(code: string, lang: FormatLang): Promise<string> {
  const [prettier, html, postcss, babel, estree, md] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/html'),
    import('prettier/plugins/postcss'),
    import('prettier/plugins/babel'),
    import('prettier/plugins/estree'),
    import('prettier/plugins/markdown'),
  ])
  const parser = { html: 'html', css: 'css', js: 'babel', json: 'json', md: 'markdown' }[lang]
  return prettier.format(code, {
    parser,
    plugins: [html, postcss, babel, estree as never, md],
    printWidth: 80,
    tabWidth: 2,
    semi: true,
    singleQuote: true,
  })
}
