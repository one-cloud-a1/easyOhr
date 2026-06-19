import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Mode = 'login' | 'register'

function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!supabase) { setLoading(false); return }
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  if (loading) return <p className="auth-sub">Bestellungen werden geladen...</p>
  if (orders.length === 0) return <p className="auth-sub">Sie haben noch keine Bestellungen.</p>

  return (
    <div className="order-list">
      {orders.map(order => (
        <div key={order.id} className="order-item">
          <div className="order-header">
            <span className="order-date">{new Date(order.created_at).toLocaleDateString('de-DE')}</span>
            <span className={`order-status order-status-${order.status}`}>{
              order.status === 'authorized' ? 'In Testphase' :
              order.status === 'captured' ? 'Bezahlt' :
              order.status === 'cancelled' ? 'Storniert' : order.status
            }</span>
          </div>
          <div className="order-total">{Number(order.total).toLocaleString('de-DE')} €</div>
        </div>
      ))}
    </div>
  )
}

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    passwort: '',
    vorname: '',
    nachname: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!supabase) { setCheckingSession(false); return }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setCheckingSession(false)
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!supabase) {
      setError('Supabase ist noch nicht konfiguriert. Bitte PUBLIC_SUPABASE_URL und PUBLIC_SUPABASE_ANON_KEY in .env setzen.')
      setLoading(false)
      return
    }

    if (mode === 'register') {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.passwort,
        options: {
          data: { vorname: formData.vorname, nachname: formData.nachname },
        },
      })
      if (authError) {
        setError(authError.message)
      } else if (data.user) {
        setSuccess('Konto erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse.')
      }
    } else {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.passwort,
      })
      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Ungültige E-Mail oder Passwort.'
          : authError.message)
      } else if (data.user) {
        setUser(data.user)
      }
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  if (checkingSession) {
    return <div className="auth-wrap"><p className="auth-sub">Wird geladen...</p></div>
  }

  if (user) {
    return (
      <div className="auth-wrap">
        <h1>Mein Konto</h1>
        <p className="auth-sub">Angemeldet als {user.email}</p>

        <h2 style={{ fontSize: '1.25rem', margin: '2rem 0 1rem' }}>Meine Bestellungen</h2>
        <OrderHistory />

        <button onClick={handleLogout} className="auth-submit" style={{ marginTop: '2rem', background: 'var(--color-text-light)' }}>
          Abmelden
        </button>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <h1>{mode === 'login' ? 'Anmelden' : 'Konto erstellen'}</h1>
      <p className="auth-sub">
        {mode === 'login'
          ? 'Melden Sie sich an, um Ihre Bestellungen einzusehen.'
          : 'Erstellen Sie ein Konto, um Ihre Bestellungen zu verwalten.'}
      </p>

      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'register' && (
          <div className="auth-row">
            <div className="auth-group">
              <label htmlFor="vorname">Vorname</label>
              <input id="vorname" name="vorname" type="text" required value={formData.vorname} onChange={handleChange} />
            </div>
            <div className="auth-group">
              <label htmlFor="nachname">Nachname</label>
              <input id="nachname" name="nachname" type="text" required value={formData.nachname} onChange={handleChange} />
            </div>
          </div>
        )}
        <div className="auth-group">
          <label htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
        </div>
        <div className="auth-group">
          <label htmlFor="passwort">Passwort</label>
          <input id="passwort" name="passwort" type="password" required minLength={8} value={formData.passwort} onChange={handleChange} />
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Bitte warten...' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
        </button>
      </form>

      <p className="auth-switch">
        {mode === 'login' ? (
          <>Noch kein Konto? <button onClick={() => setMode('register')}>Jetzt registrieren</button></>
        ) : (
          <>Bereits registriert? <button onClick={() => setMode('login')}>Anmelden</button></>
        )}
      </p>
    </div>
  )
}
