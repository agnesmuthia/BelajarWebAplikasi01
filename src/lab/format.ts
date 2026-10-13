import type { LabFileKey } from './runtime'

/** Format kode dengan Prettier. Dimuat hanya saat tombol Format ditekan (±400 KB). */
export async function formatCode(code: string, file: LabFileKey): Promise<string> {
  const [prettier, html, postcss, babel, estree] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/html'),
    import('prettier/plugins/postcss'),
    import('prettier/plugins/babel'),
    import('prettier/plugins/estree'),
  ])
  const parser = file === 'html' ? 'html' : file === 'css' ? 'css' : 'babel'
  return prettier.format(code, {
    parser,
    plugins: [html, postcss, babel, estree as never],
    printWidth: 80,
    tabWidth: 2,
    semi: true,
    singleQuote: true,
  })
}
