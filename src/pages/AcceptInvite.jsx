import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { lookupInvite } from '../lib/team'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // If the user is already authenticated (AuthContext linked them), go to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Load the invite details via SECURITY DEFINER RPC (works for unauthenticated visitors)
  useEffect(() => {
    async function loadInvite() {
      try {
        const data = await lookupInvite(token)
        if (!data) {
          setError('This invitation link is invalid or has expired.')
          return
        }
        if (data.status === 'deactivated') {
          setError('This invitation has been revoked. Please contact your team administrator.')
          return
        }
        // status === 'active' means already accepted — AuthContext will handle the redirect
        // above once isAuthenticated is true, but in case user is not signed in yet just show invite
        setInvite(data)
      } catch (err) {
        setError('This invitation link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }
    loadInvite()
  }, [token])

  async function handleAccept() {
    if (!invite) return
    setAccepting(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: invite.email,
        options: {
          // After clicking the magic link email, Supabase redirects here.
          // AuthContext will pick up SIGNED_IN, call link_user_to_member,
          // and then isAuthenticated becomes true → the useEffect above redirects to /.
          emailRedirectTo: `${window.location.origin}/invite/${token}`,
        },
      })
      if (authError) throw authError
      setMagicLinkSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send sign-in link. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  const wrapperClass = 'min-h-screen bg-surface flex items-center justify-center p-4'
  const bgStyle = {
    backgroundImage:
      'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,106,245,0.10) 0%, transparent 100%)',
  }

  // While AuthContext is checking session (e.g. magic link just clicked)
  if (authLoading || loading) {
    return (
      <div className={wrapperClass} style={bgStyle}>
        <div className="card max-w-md w-full text-center py-16 animate-fade-in">
          <div className="w-10 h-10 relative mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-surface-border" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
          </div>
          <p className="text-text-secondary text-sm">Verifying invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={wrapperClass} style={bgStyle}>
        <div className="card max-w-md w-full text-center animate-scale-in">
          <div className="w-12 h-12 rounded-2xl bg-status-error-bg border border-status-error/25 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-2">Invalid Invitation</h2>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  if (magicLinkSent) {
    return (
      <div className={wrapperClass} style={bgStyle}>
        <div className="card max-w-md w-full text-center animate-scale-in">
          <div className="w-12 h-12 rounded-2xl bg-status-success-bg border border-status-success/25 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-2">Check Your Email</h2>
          <p className="text-sm text-text-secondary mb-1">
            We sent a sign-in link to{' '}
            <span className="font-medium text-text-primary">{invite.email}</span>.
          </p>
          <p className="text-sm text-text-secondary">
            Click the link in the email to complete joining the team.
          </p>
        </div>
      </div>
    )
  }

  if (!invite) return null

  const roleName = invite.role.charAt(0).toUpperCase() + invite.role.slice(1)
  const ROLE_BADGE = {
    admin: 'text-status-info bg-status-info-bg border-status-info/25',
    editor: 'text-status-success bg-status-success-bg border-status-success/25',
    viewer: 'text-text-secondary bg-surface-elevated border-surface-border',
  }

  return (
    <div className={wrapperClass} style={bgStyle}>
      <div className="card max-w-md w-full text-center animate-scale-in">
        {/* Brand */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-accent flex items-center justify-center mx-auto mb-4 shadow-glow-accent">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-text-primary mb-2">You've been invited!</h2>
        <p className="text-sm text-text-secondary mb-6">
          You've been invited to join{' '}
          <span className="font-medium text-text-primary">ContentFlow</span> as{' '}
          <span className={`badge border ${ROLE_BADGE[invite.role] || ROLE_BADGE.viewer}`}>
            {roleName}
          </span>
        </p>

        {/* Details */}
        <div className="bg-surface-tertiary rounded-xl p-4 mb-6 text-left border border-surface-border">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
            Invitation Details
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Email</span>
              <span className="text-text-primary font-medium">{invite.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Role</span>
              <span className="text-text-primary font-medium">{roleName}</span>
            </div>
            {invite.display_name && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Name</span>
                <span className="text-text-primary font-medium">{invite.display_name}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 alert-error rounded-xl text-sm py-2.5">{error}</div>
        )}

        <button onClick={handleAccept} disabled={accepting} className="btn-primary w-full">
          {accepting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending sign-in link...
            </>
          ) : (
            'Accept Invitation'
          )}
        </button>
      </div>
    </div>
  )
}
