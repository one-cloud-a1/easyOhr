import { useState } from 'react'

type Mode = 'login' | 'register'

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [formData, setFormData] = useState({
    email: '',
    passwort: '',
    vorname: '',
    nachname: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Supabase integration placeholder
    alert(`${mode === 'login' ? 'Anmeldung' : 'Registrierung'} wird implementiert sobald Supabase konfiguriert ist.`)
    setLoading(false)
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
