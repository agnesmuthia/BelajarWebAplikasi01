import '@testing-library/jest-dom/vitest'

// jsdom tidak mengimplementasikan scrollTo
window.scrollTo = () => {}

// Bersihkan DOM setelah setiap test (vitest tanpa globals tidak melakukannya otomatis)
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
afterEach(() => cleanup())
