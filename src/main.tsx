import React from 'react'
import ReactDOM from 'react-dom/client'
import toast from 'react-hot-toast'
import App from './App'
import './index.css'

// Global catch-all: surface unhandled async errors (e.g. Firestore reads) as a toast
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
  const message = event.reason?.message ?? 'Something went wrong'
  toast.error(message, { id: 'global-error' })
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
