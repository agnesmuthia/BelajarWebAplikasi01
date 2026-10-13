/** SHA-256 heksadesimal. Dipakai untuk menyimpan isi file biner sekali saja (seperti objek Git). */
export async function sha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', data as BufferSource)
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}
