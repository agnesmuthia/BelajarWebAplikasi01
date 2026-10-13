import '@testing-library/jest-dom/vitest'

// jsdom tidak mengimplementasikan scrollTo
window.scrollTo = () => {}
