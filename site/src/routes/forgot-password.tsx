import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { clientSendPasswordReset } from '~/lib/api'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await clientSendPasswordReset(email.trim())
      if (result.ok) {
        setSent(true)
      } else {
        setError((result as any).error || 'Something went wrong.')
      }
    } catch {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0b0d11] px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center">
          <span className="text-2xl font-extrabold gradient-text">ReviewPilot</span>
        </Link>

        {sent ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-white">Check your email</h2>
            <p className="mt-2 text-sm text-slate-400">
              If an account with <strong className="text-slate-300">{email}</strong> exists, we've sent a password reset link.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
              ← Back to login
            </Link>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-lg font-bold text-white">Forgot your password?</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">Sign in</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
