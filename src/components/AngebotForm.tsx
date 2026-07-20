import { useState, useEffect } from 'react'
import { getCart, removeFromCart, onCartUpdate, clearCart, MAX_GERAETE, type CartItem } from '../lib/cart'
import { BASE } from '../lib/base-url'
import { berechne, euroRund } from '../lib/kasse'
import { HINWEIS_MITTEL } from '../lib/kasse-hinweis'

type Versicherung = 'gesetzlich' | 'privat'

interface Erfolg {
  angebotsnummer: string
  email: string
}

export default function AngebotForm() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [erfolg, setErfolg] = useState<Erfolg | null>(null)
  const [fehler, setFehler] = useState('')
  const [loading, setLoading] = useState(false)
  const [daten, setDaten] = useState({
    anrede: '',
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    strasse: '',
    plz: '',
    ort: '',
    versicherung: 'gesetzlich' as Versicherung,
    krankenkasse: '',
    rezept: 'noch-nicht',
    nachricht: '',
    datenschutz: false,
  })

  useEffect(() => {
    setCart(getCart())
    return onCartUpdate(setCart)
  }, [])

  const anzahl = cart.reduce((s, i) => s + i.menge, 0)
  const listenpreis = cart.reduce((s, i) => s + i.privatpreis * i.menge, 0)
  const gesetzlich = daten.versicherung === 'gesetzlich'

  // Schätzung nur bei einem Modell sinnvoll — bei zwei verschiedenen Geräten
  // greift die Staffelung des Kassenanteils nicht sauber.
  const einModell = cart.length === 1
  const schaetzung =
    einModell && (anzahl === 1 || anzahl === 2)
      ? berechne(cart[0].privatpreis, anzahl as 1 | 2, daten.versicherung)
      : null

  const setFeld = (name: string, wert: string | boolean) => {
    setDaten(prev => ({ ...prev, [name]: wert }))
    setFehler('')
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const t = e.target
    setFeld(t.name, t instanceof HTMLInputElement && t.type === 'checkbox' ? t.checked : t.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFehler('')

    const apiUrl = import.meta.env.PUBLIC_API_URL
    if (!apiUrl) {
      setFehler('Die Anfrage kann gerade nicht gesendet werden. Bitte rufen Sie uns an.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/angebot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kunde: daten, artikel: cart }),
      })
      const data = await res.json().catch(() => null)

      if (res.ok && data?.angebotsnummer) {
        setErfolg({ angebotsnummer: data.angebotsnummer, email: daten.email })
        clearCart()
      } else {
        setFehler(data?.error || 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.')
      }
    } catch {
      setFehler('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.')
    } finally {
      setLoading(false)
    }
  }

  if (erfolg) {
    return (
      <div className="ang-erfolg">
        <div className="ang-erfolg-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>Ihre Anfrage ist angekommen</h2>
        <p>
          Wir melden uns innerhalb von 24 Stunden mit Ihrem persönlichen Angebot bei{' '}
          <strong>{erfolg.email}</strong>.
        </p>

        <div className="ang-nummer">
          <span className="ang-nummer-label">Ihre Angebotsnummer</span>
          <span className="ang-nummer-wert">{erfolg.angebotsnummer}</span>
          <span className="ang-nummer-hint">
            Bitte geben Sie diese Nummer an, wenn Sie uns Unterlagen schicken oder anrufen.
          </span>
        </div>

        <div className="ang-naechste">
          <h3>Wie es weitergeht</h3>
          <ol>
            <li>Sie erhalten Ihr Angebot per E-Mail — mit dem genauen Eigenanteil.</li>
            <li>Für die Abrechnung mit der Krankenkasse brauchen wir die Verordnung Ihres HNO-Arztes. Wie Sie uns diese zukommen lassen, steht in der E-Mail.</li>
            <li>Danach senden wir Ihnen das Hörgerät zum 30-tägigen Testen zu.</li>
          </ol>
        </div>

        <a href={`${BASE}hoergeraete/`} className="ang-btn-ghost">Weitere Hörgeräte ansehen</a>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="ang-leer">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h2>Noch kein Gerät ausgewählt</h2>
        <p>Wählen Sie bis zu {MAX_GERAETE} Hörgeräte aus, für die Sie ein Angebot möchten.</p>
        <a href={`${BASE}hoergeraete/`} className="ang-btn-primary">Hörgeräte ansehen</a>
      </div>
    )
  }

  return (
    <div className="ang-layout">
      <section className="ang-auswahl">
        <h2>Ihre Auswahl</h2>
        {cart.map(item => (
          <div key={`${item.slug}-${item.farbe}`} className="ang-item">
            <div>
              <span className="ang-item-marke">{item.hersteller}</span>
              <h3>{item.name}</h3>
              <span className="ang-item-detail">
                Farbe: {item.farbe}
                {item.menge > 1 && ` · ${item.menge} Geräte`}
              </span>
            </div>
            <button
              type="button"
              className="ang-item-remove"
              onClick={() => removeFromCart(item.slug, item.farbe)}
            >
              Entfernen
            </button>
          </div>
        ))}

        <div className="ang-summe">
          <span>Gerätepreis {anzahl > 1 ? `(${anzahl} Geräte)` : ''}</span>
          <span className="ang-summe-wert">{euroRund(listenpreis)}</span>
        </div>

        {gesetzlich && schaetzung && (
          <div className="ang-schaetzung">
            <div className="ang-schaetzung-zeile">
              <span>Ihr voraussichtlicher Eigenanteil</span>
              <strong>ca. {euroRund(schaetzung.gesamt)}</strong>
            </div>
            <p>{HINWEIS_MITTEL}</p>
          </div>
        )}

        {anzahl < MAX_GERAETE && (
          <a href={`${BASE}hoergeraete/`} className="ang-add-more">
            + Zweites Gerät hinzufügen
          </a>
        )}
      </section>

      <form className="ang-form" onSubmit={handleSubmit}>
        <h2>Ihre Kontaktdaten</h2>
        <p className="ang-form-intro">
          Damit wir Ihnen ein Angebot mit dem genauen Eigenanteil erstellen können.
        </p>

        <div className="ang-row">
          <div className="ang-field ang-field-anrede">
            <label htmlFor="anrede">Anrede</label>
            <select id="anrede" name="anrede" value={daten.anrede} onChange={handleChange}>
              <option value="">—</option>
              <option value="Frau">Frau</option>
              <option value="Herr">Herr</option>
              <option value="Divers">Divers</option>
            </select>
          </div>
          <div className="ang-field">
            <label htmlFor="vorname">Vorname *</label>
            <input id="vorname" name="vorname" required value={daten.vorname} onChange={handleChange} autoComplete="given-name" />
          </div>
          <div className="ang-field">
            <label htmlFor="nachname">Nachname *</label>
            <input id="nachname" name="nachname" required value={daten.nachname} onChange={handleChange} autoComplete="family-name" />
          </div>
        </div>

        <div className="ang-row">
          <div className="ang-field">
            <label htmlFor="email">E-Mail *</label>
            <input id="email" name="email" type="email" required value={daten.email} onChange={handleChange} autoComplete="email" />
          </div>
          <div className="ang-field">
            <label htmlFor="telefon">Telefon *</label>
            <input id="telefon" name="telefon" type="tel" required value={daten.telefon} onChange={handleChange} autoComplete="tel" />
          </div>
        </div>

        <div className="ang-field">
          <label htmlFor="strasse">Straße und Hausnummer *</label>
          <input id="strasse" name="strasse" required value={daten.strasse} onChange={handleChange} autoComplete="street-address" />
        </div>

        <div className="ang-row">
          <div className="ang-field ang-field-plz">
            <label htmlFor="plz">PLZ *</label>
            <input id="plz" name="plz" required pattern="[0-9]{5}" maxLength={5} inputMode="numeric" value={daten.plz} onChange={handleChange} autoComplete="postal-code" />
          </div>
          <div className="ang-field">
            <label htmlFor="ort">Ort *</label>
            <input id="ort" name="ort" required value={daten.ort} onChange={handleChange} autoComplete="address-level2" />
          </div>
        </div>

        <h2 className="ang-h2-zweit">Zur Kostenübernahme</h2>

        <div className="ang-field">
          <label htmlFor="versicherung">Wie sind Sie versichert? *</label>
          <select id="versicherung" name="versicherung" value={daten.versicherung} onChange={handleChange}>
            <option value="gesetzlich">Gesetzlich versichert</option>
            <option value="privat">Privat versichert / Selbstzahler</option>
          </select>
        </div>

        {gesetzlich && (
          <div className="ang-field">
            <label htmlFor="krankenkasse">Ihre Krankenkasse</label>
            <input id="krankenkasse" name="krankenkasse" placeholder="z. B. AOK, Barmer, TK" value={daten.krankenkasse} onChange={handleChange} />
          </div>
        )}

        <div className="ang-field">
          <label htmlFor="rezept">Liegt eine ärztliche Verordnung vor?</label>
          <select id="rezept" name="rezept" value={daten.rezept} onChange={handleChange}>
            <option value="noch-nicht">Noch nicht — bitte beraten Sie mich</option>
            <option value="ja">Ja, ich habe ein Rezept vom HNO-Arzt</option>
            <option value="termin">Termin beim HNO-Arzt steht bevor</option>
          </select>
          <p className="ang-hint">
            Kein Rezept nötig, um ein Angebot zu erhalten. Für die Abrechnung mit der Krankenkasse
            brauchen wir es später.
          </p>
        </div>

        <div className="ang-field">
          <label htmlFor="nachricht">Ihre Nachricht (optional)</label>
          <textarea id="nachricht" name="nachricht" rows={3} value={daten.nachricht} onChange={handleChange} placeholder="Fragen oder Wünsche zur Beratung?" />
        </div>

        <label className="ang-check">
          <input type="checkbox" name="datenschutz" required checked={daten.datenschutz} onChange={handleChange} />
          <span>
            Ich habe die <a href={`${BASE}datenschutz/`} target="_blank" rel="noopener">Datenschutzerklärung</a>{' '}
            gelesen und willige ein, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet und an
            den anpassenden Hörakustiker weitergegeben werden. *
          </span>
        </label>

        {fehler && <div className="ang-fehler">{fehler}</div>}

        <button type="submit" className="ang-submit" disabled={loading}>
          {loading ? 'Wird gesendet …' : 'Kostenloses Angebot anfordern'}
        </button>

        <p className="ang-legal">
          Unverbindlich und kostenlos. Mit dem Absenden entsteht kein Kaufvertrag und keine
          Zahlungspflicht — Sie erhalten ein Angebot, das Sie in Ruhe prüfen können.
        </p>
      </form>
    </div>
  )
}
