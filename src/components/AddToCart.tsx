import { useState } from 'react'
import { addToCart } from '../lib/cart'

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
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart({ slug, name, hersteller, farbe: selectedFarbe, privatpreis, kassenpreis })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div>
      <div className="atc-colors">
        <h4>Farbe wählen</h4>
        <div className="atc-color-list">
          {farben.map(farbe => (
            <button
              key={farbe}
              className={`atc-color-btn ${selectedFarbe === farbe ? 'atc-color-active' : ''}`}
              onClick={() => setSelectedFarbe(farbe)}
            >
              {farbe}
            </button>
          ))}
        </div>
      </div>

      <button className={`atc-button ${added ? 'atc-added' : ''}`} onClick={handleAdd}>
        {added ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            In den Warenkorb gelegt
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Jetzt 30 Tage testen
          </>
        )}
      </button>
      <p className="atc-note">Kein Geld wird jetzt abgebucht — Zahlung erst nach der Testphase</p>
    </div>
  )
}
