import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <EmptyState icon={Compass} title="Halaman tidak ditemukan" action={<Link to="/" className="btn-primary">Kembali ke Dashboard</Link>}>
      Alamat ini tidak ada atau datanya sudah dihapus.
    </EmptyState>
  )
}
