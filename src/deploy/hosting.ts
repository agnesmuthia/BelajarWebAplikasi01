/**
 * Fakta layanan hosting. Harga & batas BISA BERUBAH — setiap angka disertai tanggal
 * pengecekan dan sumber. Perbarui file ini bila halaman resmi berubah.
 *
 * Catatan pengecekan 13 Oktober 2026: halaman resmi Netlify/Vercel tidak dapat diakses
 * langsung dari lingkungan pembuatan; angka Netlify & Vercel diambil dari beberapa
 * ringkasan pihak ketiga yang saling konsisten. GitHub Pages dari dokumentasi resmi GitHub.
 */
export const CHECKED_AT = '13 Oktober 2026'

export type PlatformId = 'github-pages' | 'netlify' | 'vercel'

export interface Platform {
  id: PlatformId
  name: string
  bestFor: string
  free: string[]
  paid: string
  commercialOnFree: 'ya' | 'terbatas' | 'tidak'
  commercialNote: string
  privateRepo: string
  serverSide: string
  previews: string
  officialPricing: string
  officialDocs: string
  sourceNote: string
}

export const PLATFORMS: Platform[] = [
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    bestFor: 'Website statis (HTML/CSS/JS) dan hasil build Vite; portofolio, website sekolah, dokumentasi.',
    free: [
      'Gratis untuk repository publik.',
      'Ukuran situs maksimal 1 GB; repository sumber disarankan ≤ 1 GB.',
      'Bandwidth ±100 GB/bulan (batas “lunak” — situs bisa berhenti dilayani atau GitHub menghubungimu bila terlampaui).',
      'Build bawaan ±10 per jam (tidak berlaku untuk workflow GitHub Actions sendiri); deploy timeout 10 menit.',
      'HTTPS gratis, termasuk untuk domain sendiri.',
    ],
    paid: 'Pages dari repository PRIVAT membutuhkan paket GitHub berbayar (Pro/Team/Enterprise). Cek github.com/pricing.',
    commercialOnFree: 'terbatas',
    commercialNote: 'Tidak ditujukan sebagai hosting gratis untuk bisnis online, toko e-commerce, atau layanan komersial utama. Portofolio & website informasi umumnya aman — baca kebijakan penggunaan GitHub Pages.',
    privateRepo: 'Butuh paket berbayar.',
    serverSide: 'Tidak ada — hanya file statis. Tidak bisa menjalankan backend/API sendiri.',
    previews: 'Tidak ada preview per PR bawaan.',
    officialPricing: 'https://github.com/pricing',
    officialDocs: 'https://docs.github.com/pages/getting-started-with-github-pages/github-pages-limits',
    sourceNote: 'Dokumentasi resmi GitHub (GitHub Pages limits).',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    bestFor: 'Situs statis & SPA dengan deploy otomatis, preview per PR, form sederhana, dan serverless functions.',
    free: [
      'Paket Free berbasis kredit: ±300 kredit/bulan dengan batas KERAS (situs dijeda sampai bulan berikutnya bila habis, tidak ada tagihan kejutan).',
      'Perkiraan biaya kredit: deploy produksi ±15 kredit, bandwidth ±20 kredit/GB — kira-kira ±15 GB bandwidth atau ±20 deploy per bulan.',
      'Deploy preview tidak memakai kredit; HTTPS gratis.',
    ],
    paid: 'Personal ±US$9/bulan (±1.000 kredit), Pro ±US$20/bulan (±3.000 kredit).',
    commercialOnFree: 'ya',
    commercialNote: 'Paket Free tidak dilarang untuk penggunaan komersial, tetapi kredit yang kecil cepat habis pada situs ramai.',
    privateRepo: 'Didukung.',
    serverSide: 'Serverless/Edge Functions (memakai kredit).',
    previews: 'Ya — URL preview untuk setiap Pull Request.',
    officialPricing: 'https://www.netlify.com/pricing/',
    officialDocs: 'https://docs.netlify.com/',
    sourceNote: 'Ringkasan pihak ketiga yang konsisten (Okt 2026); belum diverifikasi langsung di halaman resmi.',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    bestFor: 'Aplikasi frontend modern (React/Vite, Next.js) dengan serverless functions dan preview per PR.',
    free: [
      'Paket Hobby gratis, 1 anggota.',
      'Perkiraan kuota: ±100 GB transfer data/bulan, ±1 juta pemanggilan function/bulan, durasi function terbatas.',
      'HTTPS gratis; preview deployment untuk setiap branch/PR.',
    ],
    paid: 'Pro mulai ±US$20/bulan (termasuk kredit pemakaian); biaya tambahan per anggota yang melakukan deploy.',
    commercialOnFree: 'tidak',
    commercialNote: 'Hobby HANYA untuk penggunaan pribadi non-komersial. Website klien, toko, atau usaha yang menghasilkan uang wajib memakai paket Pro.',
    privateRepo: 'Didukung.',
    serverSide: 'Serverless/Edge Functions.',
    previews: 'Ya — untuk setiap branch & Pull Request.',
    officialPricing: 'https://vercel.com/pricing',
    officialDocs: 'https://vercel.com/docs',
    sourceNote: 'Ringkasan pihak ketiga yang konsisten (Okt 2026); belum diverifikasi langsung di halaman resmi.',
  },
]

export const findPlatform = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)!

/* --------------------------- pemilih platform --------------------------- */

export interface ChooserInput {
  kind: 'static' | 'vite' | 'server'
  commercial: boolean
  privateRepo: boolean
  needPreviews: boolean
}

export interface Recommendation {
  platform: PlatformId | null
  reasons: string[]
  warnings: string[]
}

export function recommend(i: ChooserInput): Recommendation {
  const reasons: string[] = []
  const warnings: string[] = []
  if (i.kind === 'server') {
    warnings.push('Proyekmu butuh server/backend sendiri (mis. Express, database). GitHub Pages tidak bisa menjalankannya; Netlify/Vercel hanya mendukung serverless functions, bukan server yang terus berjalan. Bahas di Phase 7 (Full-Stack).')
    return { platform: i.commercial ? 'netlify' : 'vercel', reasons: ['Serverless functions bisa menggantikan banyak kebutuhan backend sederhana (mis. memanggil API dengan kunci rahasia).'], warnings }
  }
  if (i.commercial) {
    reasons.push('Website komersial/klien: Vercel Hobby tidak boleh dipakai, dan GitHub Pages tidak ditujukan untuk bisnis online.')
    reasons.push('Netlify Free boleh dipakai komersial dengan kredit terbatas — siapkan rencana upgrade bila trafik naik.')
    if (i.needPreviews) reasons.push('Netlify menyediakan preview per Pull Request.')
    return { platform: 'netlify', reasons, warnings: ['Untuk klien, hitung biaya hosting & domain tahunan dan masukkan ke penawaran harga.'] }
  }
  if (i.privateRepo) {
    reasons.push('Repository privat: GitHub Pages butuh paket berbayar, sedangkan Netlify & Vercel mendukungnya di paket gratis.')
    reasons.push(i.needPreviews ? 'Vercel Hobby memberi preview per PR untuk proyek pribadi.' : 'Netlify atau Vercel sama-sama cocok.')
    return { platform: 'vercel', reasons, warnings: [] }
  }
  if (i.needPreviews) {
    reasons.push('Kamu ingin preview per Pull Request — fitur ini ada di Netlify dan Vercel, tidak ada di GitHub Pages.')
    return { platform: 'netlify', reasons, warnings: [] }
  }
  reasons.push('Proyek pribadi/pendidikan, repository publik, tanpa server: GitHub Pages gratis, sederhana, dan langsung terhubung dengan repository-mu.')
  if (i.kind === 'vite') reasons.push('Untuk proyek Vite, gunakan workflow GitHub Actions resmi (tersedia di tab Repo & Deploy proyek).')
  return { platform: 'github-pages', reasons, warnings: [] }
}

/* ------------------------------- DNS ------------------------------- */

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT'
  host: string
  value: string
  note?: string
}

/** Nilai DNS umum. Dashboard platform SELALU menjadi acuan utama bila nilainya berbeda. */
export function dnsRecords(platform: PlatformId, domain: string, target: string): DnsRecord[] {
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'contoh.sch.id'
  if (platform === 'github-pages') {
    const t = target.trim() || 'username.github.io'
    return [
      ...['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'].map((ip) => ({ type: 'A' as const, host: '@', value: ip, note: `domain utama ${d}` })),
      ...['2606:50c0:8000::153', '2606:50c0:8001::153', '2606:50c0:8002::153', '2606:50c0:8003::153'].map((ip) => ({ type: 'AAAA' as const, host: '@', value: ip, note: 'IPv6 (opsional)' })),
      { type: 'CNAME', host: 'www', value: t, note: `www.${d}` },
    ]
  }
  if (platform === 'netlify') {
    const t = target.trim() || 'nama-situs.netlify.app'
    return [
      { type: 'A', host: '@', value: '75.2.60.5', note: `domain utama ${d} (load balancer Netlify)` },
      { type: 'CNAME', host: 'www', value: t, note: `www.${d}` },
    ]
  }
  return [
    { type: 'A', host: '@', value: '76.76.21.21', note: `domain utama ${d} — Vercel bisa menampilkan nilai khusus proyek; pakai nilai dari dashboard bila berbeda` },
    { type: 'CNAME', host: 'www', value: target.trim() || 'cname.vercel-dns.com', note: `www.${d}` },
  ]
}
