import { useState, useEffect } from 'react'
import { getCart, removeFromCart, onCartUpdate, type CartItem } from '../lib/cart'
import { supabase } from '../lib/supabase'

export default function CheckoutForm() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    strasse: '',
    plz: '',
    ort: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCart(getCart())
    return onCartUpdate(setCart)
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata
        setFormData(prev => ({
          ...prev,
          email: data.user!.email || prev.email,
          vorname: meta?.vorname || prev.vorname,
          nachname: meta?.nachname || prev.nachname,
        }))
      }
    })
  }, [])

  const total = cart.reduce((sum, item) => sum + item.privatpreis * item.menge, 0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRemove = (slug: string, farbe: string) => {
    removeFromCart(slug, farbe)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const apiUrl = import.meta.env.PUBLIC_API_URL
    if (!apiUrl) {
      alert('API ist noch nicht konfiguriert. Bitte PUBLIC_API_URL in .env setzen (Cloudflare Worker URL).')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/order/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: formData, items: cart }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
      } else {
        const errData = await response.json().catch(() => null)
        alert(errData?.error || 'Fehler bei der Bestellung. Bitte versuchen Sie es erneut.')
      }
    } catch {
      alert('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <h2>Ihr Warenkorb ist leer</h2>
        <p>Stöbern Sie durch unsere Hörgeräte und finden Sie Ihr Wunschmodell.</p>
        <a href={`${import.meta.env.BASE_URL}hoergeraete/`} className="co-btn-primary">Hörgeräte entdecken</a>
      </div>
    )
  }

  return (
    <div className="checkout-layout">
      <div className="checkout-cart">
        <h2>Warenkorb</h2>
        {cart.map(item => (
          <div key={`${item.slug}-${item.farbe}`} className="cart-item">
            <div className="cart-item-info">
              <span className="cart-brand">{item.hersteller}</span>
              <h4>{item.name}</h4>
              <span className="cart-color">Farbe: {item.farbe}</span>
              {item.menge > 1 && <span className="cart-color">Menge: {item.menge}</span>}
            </div>
            <div className="cart-item-price">
              <span>{(item.privatpreis * item.menge).toLocaleString('de-DE')} €</span>
              <button className="cart-remove" onClick={() => handleRemove(item.slug, item.farbe)}>Entfernen</button>
            </div>
          </div>
        ))}
        <div className="cart-total">
          <span>Gesamtbetrag</span>
          <span className="cart-total-price">{total.toLocaleString('de-DE')} €</span>
        </div>
        <p className="cart-note">Dieser Betrag wird erst nach der 30-tägigen Testphase abgebucht, wenn Sie das Hörgerät behalten.</p>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <h2>Ihre Daten</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="vorname">Vorname *</label>
            <input id="vorname" name="vorname" type="text" required value={formData.vorname} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="nachname">Nachname *</label>
            <input id="nachname" name="nachname" type="text" required value={formData.nachname} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="email">E-Mail *</label>
          <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="telefon">Telefon *</label>
          <input id="telefon" name="telefon" type="tel" required value={formData.telefon} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="strasse">Straße und Hausnummer *</label>
          <input id="strasse" name="strasse" type="text" required value={formData.strasse} onChange={handleChange} />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: '0 0 120px' }}>
            <label htmlFor="plz">PLZ *</label>
            <input id="plz" name="plz" type="text" required pattern="[0-9]{5}" maxLength={5} value={formData.plz} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="ort">Ort *</label>
            <input id="ort" name="ort" type="text" required value={formData.ort} onChange={handleChange} />
          </div>
        </div>

        <div className="checkout-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p>Sichere Zahlung über Mollie. Es wird <strong>kein Geld abgebucht</strong> — die Zahlung wird nur autorisiert und erst nach der Testphase eingezogen.</p>
        </div>

        <button type="submit" className="co-btn-accent" disabled={loading}>
          {loading ? 'Wird verarbeitet...' : 'Kostenpflichtig bestellen'}
        </button>
        <p className="checkout-legal">
          Mit Klick auf "Kostenpflichtig bestellen" akzeptieren Sie unsere <a href={`${import.meta.env.BASE_URL}agb/`}>AGB</a> und <a href={`${import.meta.env.BASE_URL}datenschutz/`}>Datenschutzerklärung</a>. Die Zahlung wird erst nach der 30-tägigen Testphase eingezogen.
        </p>
      </form>
    </div>
  )
}
