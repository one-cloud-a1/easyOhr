import { useState } from 'react'
import { addZubehoer, euro } from '../lib/zubehoer-cart'

interface Props {
  slug: string
  name: string
  variante: string
  preis: number
}

export default function AddZubehoerButton({ slug, name, variante, preis }: Props) {
  const [added, setAdded] = useState(false)
  const base = import.meta.env.BASE_URL

  const add = () => {
    addZubehoer({ key: slug, name, variante, einzelpreis: preis })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="azb">
      <button type="button" className={`azb-btn ${added ? 'azb-btn-ok' : ''}`} onClick={add}>
        {added ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            In den Warenkorb gelegt
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            In den Warenkorb — {euro(preis)}
          </>
        )}
      </button>
      {added && (
        <a href={`${base}zubehoer/#warenkorb`} className="azb-link">Zum Warenkorb & bestellen →</a>
      )}
    </div>
  )
}
