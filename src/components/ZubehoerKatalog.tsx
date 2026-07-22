import { useState } from 'react'
import { addZubehoer, euro } from '../lib/zubehoer-cart'
import { BASE } from '../lib/base-url'
import { url } from '../lib/links'
import ZubehoerWarenkorb from './ZubehoerWarenkorb'

interface Staffel {
  abMenge: number
  preis: number
}

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
  staffel?: Staffel
  bilder?: string[]
}

function Bild({ p }: { p: Produkt }) {
  if (p.bilder && p.bilder.length > 0) {
    return <img src={url(p.bilder[0])} alt={p.name} className="zk-bild-foto" loading="lazy" />
  }
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
    addZubehoer({
      key: p.slug, name: p.name, variante: p.packung, einzelpreis: p.preis,
      staffelAbMenge: p.staffel?.abMenge, staffelPreis: p.staffel?.preis,
    })
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
        {p.staffel && (
          <span className="zk-staffel">ab {p.staffel.abMenge} Paketen je {euro(p.staffel.preis)}</span>
        )}
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

  return (
    <div className="zk">
      <div className="zk-katalog">
        <h2 className="zk-gruppe-titel">Cerumenfilter</h2>
        <p className="zk-gruppe-info">Schützen den Hörer Ihres Hörgeräts. Empfohlen wird ein regelmäßiger Wechsel.</p>
        <div className="zk-grid">
          {filter.map(p => <Karte key={p.slug} p={p} />)}
        </div>

        <h2 className="zk-gruppe-titel">Batterien</h2>
        <p className="zk-gruppe-info">Zink-Luft-Batterien für Hörgeräte mit Batteriebetrieb — nur im 10er-Paket mit 60 Batterien. Die Farbe steht für die Größe.</p>
        <div className="zk-grid">
          {batterien.map(p => <Karte key={p.slug} p={p} />)}
        </div>
      </div>

      <ZubehoerWarenkorb />
    </div>
  )
}
