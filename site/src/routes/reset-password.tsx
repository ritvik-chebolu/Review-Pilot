import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { clientResetPassword } from '~/lib/api'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const search = Route.useSearch() as { token?: string }
  const token = search.token || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await clientResetPassword(token, password)
      if (result.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigate({ to: '/login' })
        }, 3000)
      } else {
        setError((result as any).error || 'Failed to reset password.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0b0d11] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 block text-center">
          <span className="text-2xl font-extrabold gradient-text">ReviewPilot</span>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-lg font-bold text-white">Reset your password</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your new password below.</p>

          {success ? (
            <div className="mt-6 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="text-sm text-slate-300">Password successfully updated!</p>
              <p className="text-xs text-slate-500">Redirecting to login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {!token && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                  Warning: No valid reset token was found in the URL.
                </div>
              )}

              <div>
                <label htmlFor="pass" className="block text-sm font-medium text-slate-300">New Password</label>
                <input
                  id="pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="confirmPass" className="block text-sm font-medium text-slate-300">Confirm New Password</label>
                <input
                  id="confirmPass"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !token || !password || !confirmPassword}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
