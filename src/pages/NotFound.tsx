import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-primary-container flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-container rounded-2xl mb-6">
          <span className="material-symbols-outlined text-on-secondary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            find_in_page
          </span>
        </div>
        <h1 className="font-display text-display-lg text-on-primary mb-2">404</h1>
        <h2 className="font-display text-title-sm text-on-primary mb-3">Page Not Found</h2>
        <p className="text-body-md text-on-primary-container mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          className="bg-secondary-container text-on-secondary-container px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
