import { useState, useMemo } from 'react'

interface Product {
  slug: string
  name: string
  hersteller: string
  familie: string
  technologie: string
  typ: string
  privatpreis: number
  kassenpreis: number
  features: string[]
  beschreibung: string
  farben: string[]
  akkuLaufzeit: string
  schutzklasse: string
  bild: string
}

function ProductCardReact({ product }: { product: Product }) {
  const badgeClass =
    product.technologie === 'Premium' ? 'badge-premium' :
    product.technologie === 'Advanced' ? 'badge-advanced' :
    product.technologie === 'Standard' ? 'badge-standard' : 'badge-basis'

  return (
    <a href={`${import.meta.env.BASE_URL}hoergeraete/${product.slug}/`} className="pf-card">
      <div className="pf-card-image">
        <img
          src={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}${product.bild}`}
          alt={product.name}
          className="pf-card-img"
          loading="lazy"
        />
        <span className={`pf-badge ${badgeClass}`}>{product.technologie}</span>
      </div>
      <div className="pf-card-info">
        <span className="pf-brand">{product.hersteller}</span>
        <h3 className="pf-name">{product.name}</h3>
        <div className="pf-features">
          {product.features.slice(0, 3).map(f => (
            <span key={f} className="pf-tag">{f}</span>
          ))}
          {product.features.length > 3 && <span className="pf-more">+{product.features.length - 3}</span>}
        </div>
        <div className="pf-pricing">
          <div>
            <span className="pf-price-label">Privatpreis</span>
            <span className="pf-price">{product.privatpreis.toLocaleString('de-DE')} €</span>
          </div>
          <div>
            <span className="pf-price-label">Mit Kasse ab</span>
            <span className="pf-price pf-price-kasse">{product.kassenpreis.toLocaleString('de-DE')} €</span>
          </div>
        </div>
        <span className="pf-cta">Jetzt 30 Tage testen</span>
      </div>
    </a>
  )
}

export default function ProductFilter({ products }: { products: Product[] }) {
  const [hersteller, setHersteller] = useState<string>('alle')
  const [technologie, setTechnologie] = useState<string>('alle')
  const [sortBy, setSortBy] = useState<string>('name')

  const filtered = useMemo(() => {
    let result = [...products]
    if (hersteller !== 'alle') result = result.filter(p => p.hersteller === hersteller)
    if (technologie !== 'alle') result = result.filter(p => p.technologie === technologie)

    result.sort((a, b) => {
      if (sortBy === 'preis-auf') return a.privatpreis - b.privatpreis
      if (sortBy === 'preis-ab') return b.privatpreis - a.privatpreis
      return a.name.localeCompare(b.name)
    })

    return result
  }, [products, hersteller, technologie, sortBy])

  const herstellerList = [...new Set(products.map(p => p.hersteller))]
  const techList = [...new Set(products.map(p => p.technologie))]

  return (
    <div>
      <div className="pf-filters">
        <div className="pf-filter-group">
          <label>Hersteller</label>
          <select value={hersteller} onChange={e => setHersteller(e.target.value)}>
            <option value="alle">Alle Hersteller</option>
            {herstellerList.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="pf-filter-group">
          <label>Technologie-Level</label>
          <select value={technologie} onChange={e => setTechnologie(e.target.value)}>
            <option value="alle">Alle Level</option>
            {techList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="pf-filter-group">
          <label>Sortierung</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Name A-Z</option>
            <option value="preis-auf">Preis aufsteigend</option>
            <option value="preis-ab">Preis absteigend</option>
          </select>
        </div>
        <div className="pf-count">{filtered.length} Hörgeräte</div>
      </div>

      {filtered.length === 0 ? (
        <div className="pf-empty">
          <p>Keine Hörgeräte gefunden. Bitte passen Sie Ihre Filter an.</p>
        </div>
      ) : (
        <div className="pf-grid">
          {filtered.map(p => <ProductCardReact key={p.slug} product={p} />)}
        </div>
      )}
    </div>
  )
}
