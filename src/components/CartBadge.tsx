import { useState, useEffect } from 'react'
import { getCartCount, onCartUpdate } from '../lib/cart'
import { getZubehoer, anzahlStueck, onZubehoerUpdate } from '../lib/zubehoer-cart'

export default function CartBadge() {
  const [count, setCount] = useState(0)

  // Zeigt Hörgeräte + Zubehör zusammen — beide sind über die Anfrage-Seite
  // im selben Warenkorb erreichbar.
  useEffect(() => {
    const aktualisiere = () => setCount(getCartCount() + anzahlStueck(getZubehoer()))
    aktualisiere()
    const abHoergeraete = onCartUpdate(aktualisiere)
    const abZubehoer = onZubehoerUpdate(aktualisiere)
    return () => { abHoergeraete(); abZubehoer() }
  }, [])

  if (count === 0) return null

  return (
    <span style={{
      position: 'absolute',
      top: '-6px',
      right: '-8px',
      background: 'var(--color-accent)',
      color: 'white',
      fontSize: '0.7rem',
      fontWeight: 700,
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {count}
    </span>
  )
}
