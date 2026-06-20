import { useState } from 'react'
import { addToCart } from '../lib/cart'

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

  const einzelpreis = versicherung === 'gesetzlich' ? kassenpreis : privatpreis
  const gesamtpreis = einzelpreis * anzahl

  const handleAdd = () => {
    for (let i = 0; i < anzahl; i++) {
      addToCart({ slug, name, hersteller, farbe: selectedFarbe, privatpreis, kassenpreis })
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
        {versicherung === 'gesetzlich' && (
          <p className="atc-hint">Eigenanteil nach Abzug des Krankenkassen-Festbetrags. Der genaue Betrag kann je nach Kasse variieren.</p>
        )}
      </div>

      <div className="atc-price-summary">
        <div className="atc-price-row">
          <span className="atc-price-label">
            {anzahl === 1 ? 'Preis pro Gerät' : 'Preis für 2 Geräte'}
          </span>
          <span className="atc-price-value">{gesamtpreis.toLocaleString('de-DE')} €</span>
        </div>
        {versicherung === 'gesetzlich' && (
          <div className="atc-price-row atc-price-detail">
            <span>Privatpreis: {(privatpreis * anzahl).toLocaleString('de-DE')} €</span>
            <span>Kassenanteil: -{((privatpreis - kassenpreis) * anzahl).toLocaleString('de-DE')} €</span>
          </div>
        )}
        {anzahl === 2 && (
          <div className="atc-price-row atc-price-detail">
            <span>Einzelpreis: {einzelpreis.toLocaleString('de-DE')} € pro Ohr</span>
          </div>
        )}
      </div>

      <button className={`atc-button ${added ? 'atc-added' : ''}`} onClick={handleAdd}>
        {added ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            In den Warenkorb gelegt!
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Jetzt 30 Tage testen — {gesamtpreis.toLocaleString('de-DE')} €
          </>
        )}
      </button>
      <p className="atc-note">Kein Geld wird jetzt abgebucht — Zahlung erst nach der Testphase</p>
    </div>
  )
}
