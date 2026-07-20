import { useState, useEffect } from 'react'
import { addToCart, getCartCount, onCartUpdate, MAX_GERAETE } from '../lib/cart'
import { berechne, euro, euroRund, ZUZAHLUNG_PRO_GERAET } from '../lib/kasse'
import { HINWEIS_MITTEL } from '../lib/kasse-hinweis'
import { BASE } from '../lib/base-url'

const FARB_MAP: Record<string, string> = {
  'Samt Schwarz': '#1a1a1a',
  'Kupfer': '#b87333',
  'Sandelholz': '#d2b48c',
  'Silbergrau': '#a8a9ad',
  'Champagner': '#f7e7ce',
  'Sand Beige': '#d2b48c',
  'Graphit Grau': '#4a4a4a',
  'Kastanie': '#633a34',
  'Schwarz': '#1a1a1a',
  'Quarzsand': '#d6cfc7',
  'Platin': '#b0b0b0',
  'Silberweiß': '#e0e0e0',
  'Sienna-Braun': '#8b4513',
  'Nussbraun': '#6b4226',
  'Titan': '#878681',
  'Perl-Schwarz': '#2c2c2c',
  'Honig Blond': '#c8a95e',
  'Blau': '#3a5f8a',
  'Silber': '#c0c0c0',
  'Beige': '#d9c9a3',
  'Karamell': '#a0522d',
  'Graphit': '#4a4a4a',
  'Weiß': '#f5f5f0',
}

interface Props {
  slug: string
  name: string
  hersteller: string
  privatpreis: number
  kassenpreis: number
  farben: string[]
}

export default function AddToCart({ slug, name, hersteller, privatpreis, kassenpreis, farben }: Props) {
  const [selectedFarbe, setSelectedFarbe] = useState(farben[0] || '')
  const [anzahl, setAnzahl] = useState<1 | 2>(1)
  const [versicherung, setVersicherung] = useState<'privat' | 'gesetzlich'>('gesetzlich')
  const [added, setAdded] = useState(false)
  const [imWarenkorb, setImWarenkorb] = useState(0)

  useEffect(() => {
    setImWarenkorb(getCartCount())
    return onCartUpdate(() => setImWarenkorb(getCartCount()))
  }, [])

  const gesetzlich = versicherung === 'gesetzlich'
  const r = berechne(privatpreis, anzahl, versicherung)
  const gesamtpreis = r.gesamt

  const frei = MAX_GERAETE - imWarenkorb
  const passtNicht = anzahl > frei

  const handleAdd = () => {
    if (!addToCart({ slug, name, hersteller, farbe: selectedFarbe, privatpreis, kassenpreis }, anzahl)) {
      return
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="atc-wrap">
      <div className="atc-section">
        <label className="atc-label">Farbe wählen</label>
        <div className="atc-color-grid">
          {farben.map(farbe => (
            <button
              key={farbe}
              className={`atc-color-chip ${selectedFarbe === farbe ? 'atc-color-selected' : ''}`}
              onClick={() => setSelectedFarbe(farbe)}
              title={farbe}
            >
              <span
                className="atc-color-swatch"
                style={{ background: FARB_MAP[farbe] || '#ccc' }}
              />
              <span className="atc-color-name">{farbe}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="atc-section">
        <label className="atc-label">Anzahl</label>
        <div className="atc-toggle-group">
          <button
            className={`atc-toggle ${anzahl === 1 ? 'atc-toggle-active' : ''}`}
            onClick={() => setAnzahl(1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="7" r="4"/><path d="M5.8 21a8 8 0 0 1 12.4 0"/></svg>
            1 Ohr
          </button>
          <button
            className={`atc-toggle ${anzahl === 2 ? 'atc-toggle-active' : ''}`}
            onClick={() => setAnzahl(2)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M2 21a6 6 0 0 1 12 0"/><path d="M12 21a6 6 0 0 1 10 0"/></svg>
            2 Ohren (Paar)
          </button>
        </div>
      </div>

      <div className="atc-section">
        <label className="atc-label">Versicherung</label>
        <div className="atc-toggle-group">
          <button
            className={`atc-toggle ${versicherung === 'gesetzlich' ? 'atc-toggle-active' : ''}`}
            onClick={() => setVersicherung('gesetzlich')}
          >
            Gesetzlich versichert
          </button>
          <button
            className={`atc-toggle ${versicherung === 'privat' ? 'atc-toggle-active' : ''}`}
            onClick={() => setVersicherung('privat')}
          >
            Privat / Selbstzahler
          </button>
        </div>
      </div>

      <div className="atc-price-summary">
        <div className="atc-price-row">
          <span className="atc-price-label">
            {gesetzlich
              ? `Voraussichtlicher Eigenanteil ${anzahl === 2 ? 'für beide Ohren' : 'für ein Ohr'}`
              : anzahl === 1 ? 'Preis pro Gerät' : 'Preis für 2 Geräte'}
          </span>
          <span className="atc-price-value">
            {gesetzlich && <span className="atc-ca">ca. </span>}
            {euroRund(gesamtpreis)}
          </span>
        </div>
        {gesetzlich && (
          <div className="atc-price-row atc-price-detail">
            <span>Gerätepreis: {euroRund(r.listenpreis)}</span>
            <span>Kasse: −{euroRund(r.kassenleistung)} · Zuzahlung: +{euroRund(r.zuzahlung)}</span>
          </div>
        )}
        {!gesetzlich && anzahl === 2 && (
          <div className="atc-price-row atc-price-detail">
            <span>Einzelpreis: {euroRund(privatpreis)} pro Ohr</span>
          </div>
        )}
      </div>

      {gesetzlich && (
        <div className="atc-vorbehalt">
          <p>{HINWEIS_MITTEL}</p>
          <a href={`${BASE}kassenrechner/`}>Eigenanteil genauer berechnen</a>
        </div>
      )}

      <button
        className={`atc-button ${added ? 'atc-added' : ''}`}
        onClick={handleAdd}
        disabled={passtNicht}
      >
        {added ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Zur Anfrage hinzugefügt!
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Kostenloses Angebot anfordern
          </>
        )}
      </button>

      {passtNicht ? (
        <p className="atc-note atc-note-warn">
          {frei === 0
            ? `Sie haben bereits ${MAX_GERAETE} Geräte in Ihrer Anfrage. `
            : `Es ist noch Platz für ein Gerät. `}
          <a href={`${BASE}anfrage/`}>Anfrage ansehen</a>
        </p>
      ) : (
        <p className="atc-note">
          Unverbindlich und kostenlos — Sie erhalten ein persönliches Angebot, keine Rechnung.
        </p>
      )}
    </div>
  )
}
