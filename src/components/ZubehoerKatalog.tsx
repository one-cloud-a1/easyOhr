import { useState, useEffect } from 'react'
import {
  getZubehoer, addZubehoer, setMenge, clearZubehoer, onZubehoerUpdate,
  zwischensumme, versandkosten, euro, VERSAND_FREI_AB,
  type ZubehoerItem,
} from '../lib/zubehoer-cart'

interface Produkt {
  slug: string
  kategorie: 'filter' | 'batterie'
  name: string
  marke?: string
  typ?: string
  farbeHex?: string
  packung: string
  preis: number
  evolution?: boolean
}

const BASE = import.meta.env.BASE_URL

function Bild({ p }: { p: Produkt }) {
  if (p.kategorie === 'batterie') {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="zk-bild-svg">
        <circle cx="32" cy="28" r="17" fill={p.farbeHex} opacity="0.18" />
        <circle cx="32" cy="28" r="12" fill={p.farbeHex} opacity="0.9" />
        <rect x="26" y="22" width="12" height="4" rx="2" fill="#fff" opacity="0.85" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="#0F6E56" strokeWidth="2.2" aria-hidden="true" className="zk-bild-svg">
      <circle cx="32" cy="32" r="16" opacity="0.9" />
      <circle cx="32" cy="32" r="8" opacity="0.55" />
      <circle cx="32" cy="32" r="2.5" fill="#0F6E56" stroke="none" />
    </svg>
  )
}

function Karte({ p }: { p: Produkt }) {
  const [added, setAdded] = useState(false)
  const detail = `${BASE}zubehoer/${p.slug}/`
  const add = () => {
    addZubehoer({ key: p.slug, name: p.name, variante: p.packung, einzelpreis: p.preis })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }
  return (
    <div className="zk-karte">
      <a href={detail} className="zk-karte-bild">
        <Bild p={p} />
        {p.evolution && <span className="zk-evo-badge">Evolution</span>}
      </a>
      <div className="zk-karte-body">
        <span className="zk-marke">{p.marke ?? p.typ}</span>
        <a href={detail} className="zk-karte-name"><h3>{p.name}</h3></a>
        <span className="zk-packung">{p.packung}</span>
        <div className="zk-karte-fuss">
          <span className="zk-preis">{euro(p.preis)}</span>
          <button type="button" className={`zk-add ${added ? 'zk-add-ok' : ''}`} onClick={add}>
            {added ? 'Hinzugefügt' : 'In den Warenkorb'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ZubehoerKatalog({ produkte }: { produkte: Produkt[] }) {
  const filter = produkte.filter(p => p.kategorie === 'filter')
  const batterien = produkte.filter(p => p.kategorie === 'batterie')

  const [cart, setCart] = useState<ZubehoerItem[]>([])
  const [zeigeForm, setZeigeForm] = useState(false)
  const [erfolg, setErfolg] = useState<string | null>(null)
  const [fehler, setFehler] = useState('')
  const [loading, setLoading] = useState(false)
  const [daten, setDaten] = useState({
    vorname: '', nachname: '', email: '', telefon: '',
    strasse: '', plz: '', ort: '', nachricht: '', datenschutz: false,
  })

  useEffect(() => {
    setCart(getZubehoer())
    return onZubehoerUpdate(setCart)
  }, [])

  const summe = zwischensumme(cart)
  const versand = versandkosten(summe)
  const gesamt = summe + versand

  const setFeld = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const t = e.target
    setDaten(prev => ({ ...prev, [t.name]: t instanceof HTMLInputElement && t.type === 'checkbox' ? t.checked : t.value }))
    setFehler('')
  }

  const bestellen = async (e: React.FormEvent) => {
    e.preventDefault()
    const apiUrl = import.meta.env.PUBLIC_API_URL
    if (!apiUrl) { setFehler('Bestellung derzeit nicht möglich. Bitte schreiben Sie uns eine E-Mail.'); return }
    setLoading(true); setFehler('')
    try {
      const res = await fetch(`${apiUrl}/api/bestellung`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kunde: daten, artikel: cart, zwischensumme: summe, versand, gesamt }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.bestellnummer) {
        setErfolg(data.bestellnummer)
        clearZubehoer()
      } else {
        setFehler(data?.error || 'Die Bestellung konnte nicht gesendet werden. Bitte erneut versuchen.')
      }
    } catch {
      setFehler('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.')
    } finally {
      setLoading(false)
    }
  }

  if (erfolg) {
    return (
      <div className="zk-erfolg">
        <div className="zk-erfolg-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h2>Ihre Bestellung ist eingegangen</h2>
        <p>Wir versenden Ihre Artikel und schicken Ihnen die Rechnung per E-Mail. Ihre Bestellnummer:</p>
        <p className="zk-bestellnr">{erfolg}</p>
      </div>
    )
  }

  return (
    <div className="zk">
      <div className="zk-katalog">
        <h2 className="zk-gruppe-titel">Cerumenfilter</h2>
        <p className="zk-gruppe-info">Schützen den Hörer Ihres Hörgeräts. Empfohlener Wechsel alle 4 bis 6 Wochen.</p>
        <div className="zk-grid">
          {filter.map(p => <Karte key={p.slug} p={p} />)}
        </div>

        <h2 className="zk-gruppe-titel">Batterien</h2>
        <p className="zk-gruppe-info">Zink-Luft-Batterien für Hörgeräte mit Batteriebetrieb — nur im 10er-Paket mit 60 Batterien. Die Farbe steht für die Größe.</p>
        <div className="zk-grid">
          {batterien.map(p => <Karte key={p.slug} p={p} />)}
        </div>
      </div>

      <aside className="zk-cart" id="warenkorb">
        <h2>Warenkorb</h2>
        {cart.length === 0 ? (
          <p className="zk-cart-leer">Noch keine Artikel ausgewählt.</p>
        ) : (
          <>
            <ul className="zk-cart-liste">
              {cart.map(i => (
                <li key={i.key}>
                  <div className="zk-cart-info">
                    <strong>{i.name}</strong>
                    <span>{i.variante}</span>
                  </div>
                  <div className="zk-cart-menge">
                    <button type="button" onClick={() => setMenge(i.key, i.menge - 1)} aria-label="Weniger">−</button>
                    <span>{i.menge}</span>
                    <button type="button" onClick={() => setMenge(i.key, i.menge + 1)} aria-label="Mehr">+</button>
                  </div>
                  <span className="zk-cart-preis">{euro(i.einzelpreis * i.menge)}</span>
                </li>
              ))}
            </ul>

            <div className="zk-cart-summe">
              <div><span>Zwischensumme</span><span>{euro(summe)}</span></div>
              <div><span>Versand</span><span>{versand === 0 ? 'kostenlos' : euro(versand)}</span></div>
              {versand > 0 && (
                <p className="zk-versand-hint">Noch {euro(VERSAND_FREI_AB - summe)} bis zum kostenlosen Versand.</p>
              )}
              <div className="zk-cart-gesamt"><span>Gesamt</span><span>{euro(gesamt)}</span></div>
            </div>

            {!zeigeForm ? (
              <button type="button" className="zk-weiter" onClick={() => setZeigeForm(true)}>Zur Bestellung</button>
            ) : (
              <form className="zk-form" onSubmit={bestellen}>
                <div className="zk-form-row">
                  <input name="vorname" placeholder="Vorname *" required value={daten.vorname} onChange={setFeld} autoComplete="given-name" />
                  <input name="nachname" placeholder="Nachname *" required value={daten.nachname} onChange={setFeld} autoComplete="family-name" />
                </div>
                <input name="email" type="email" placeholder="E-Mail *" required value={daten.email} onChange={setFeld} autoComplete="email" />
                <input name="telefon" type="tel" placeholder="Telefon *" required value={daten.telefon} onChange={setFeld} autoComplete="tel" />
                <input name="strasse" placeholder="Straße und Hausnummer *" required value={daten.strasse} onChange={setFeld} autoComplete="street-address" />
                <div className="zk-form-row">
                  <input name="plz" placeholder="PLZ *" required pattern="[0-9]{5}" maxLength={5} inputMode="numeric" value={daten.plz} onChange={setFeld} autoComplete="postal-code" style={{ flex: '0 0 96px' }} />
                  <input name="ort" placeholder="Ort *" required value={daten.ort} onChange={setFeld} autoComplete="address-level2" />
                </div>
                <label className="zk-check zk-check-dsgvo">
                  <input type="checkbox" name="datenschutz" required checked={daten.datenschutz} onChange={setFeld} />
                  <span>Ich habe die <a href={`${BASE}datenschutz/`} target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen. *</span>
                </label>
                {fehler && <div className="zk-fehler">{fehler}</div>}
                <button type="submit" className="zk-bestellen" disabled={loading}>
                  {loading ? 'Wird gesendet …' : `Kostenpflichtig bestellen — ${euro(gesamt)}`}
                </button>
                <p className="zk-form-legal">Wir versenden die Ware und stellen Ihnen die Rechnung per E-Mail. Es fallen keine Vorabkosten an.</p>
              </form>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
