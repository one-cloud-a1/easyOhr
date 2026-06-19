import { useState } from 'react'

interface Product {
  slug: string
  name: string
  hersteller: string
  familie: string
  technologie: string
  privatpreis: number
  kassenpreis: number
  features: string[]
  farben: string[]
  akkuLaufzeit: string
  schutzklasse: string
}

export default function ProductCompare({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleProduct = (slug: string) => {
    setSelected(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug)
      if (prev.length >= 3) return prev
      return [...prev, slug]
    })
  }

  const selectedProducts = selected.map(slug => products.find(p => p.slug === slug)!).filter(Boolean)
  const allFeatures = [...new Set(selectedProducts.flatMap(p => p.features))]

  return (
    <div>
      <div className="compare-selector">
        <h3>Modelle auswählen (max. 3)</h3>
        <div className="compare-chips">
          {products.map(p => (
            <button
              key={p.slug}
              className={`compare-chip ${selected.includes(p.slug) ? 'compare-chip-active' : ''}`}
              onClick={() => toggleProduct(p.slug)}
              disabled={!selected.includes(p.slug) && selected.length >= 3}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {selectedProducts.length >= 2 ? (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                {selectedProducts.map(p => (
                  <th key={p.slug}>
                    <span className="ct-brand">{p.hersteller}</span>
                    <span className="ct-name">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ct-label">Technologie</td>
                {selectedProducts.map(p => <td key={p.slug}><span className={`ct-badge ${p.technologie === 'Premium' ? 'ct-premium' : p.technologie === 'Advanced' ? 'ct-advanced' : 'ct-standard'}`}>{p.technologie}</span></td>)}
              </tr>
              <tr>
                <td className="ct-label">Familie</td>
                {selectedProducts.map(p => <td key={p.slug}>{p.familie}</td>)}
              </tr>
              <tr>
                <td className="ct-label">Privatpreis</td>
                {selectedProducts.map(p => <td key={p.slug} className="ct-price">{p.privatpreis.toLocaleString('de-DE')} €</td>)}
              </tr>
              <tr>
                <td className="ct-label">Mit Kasse ab</td>
                {selectedProducts.map(p => <td key={p.slug} className="ct-price ct-price-kasse">{p.kassenpreis.toLocaleString('de-DE')} €</td>)}
              </tr>
              <tr>
                <td className="ct-label">Akkulaufzeit</td>
                {selectedProducts.map(p => <td key={p.slug}>{p.akkuLaufzeit}</td>)}
              </tr>
              <tr>
                <td className="ct-label">Schutzklasse</td>
                {selectedProducts.map(p => <td key={p.slug}>{p.schutzklasse}</td>)}
              </tr>
              <tr>
                <td className="ct-label">Farben</td>
                {selectedProducts.map(p => <td key={p.slug}>{p.farben.length} Farben</td>)}
              </tr>
              {allFeatures.map(feature => (
                <tr key={feature}>
                  <td className="ct-label">{feature}</td>
                  {selectedProducts.map(p => (
                    <td key={p.slug}>
                      {p.features.includes(feature) ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D3D1C7" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td></td>
                {selectedProducts.map(p => (
                  <td key={p.slug}>
                    <a href={`/hoergeraete/${p.slug}/`} className="ct-cta">Details ansehen</a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="compare-empty">
          <p>Wählen Sie mindestens 2 Hörgeräte aus, um sie zu vergleichen.</p>
        </div>
      )}
    </div>
  )
}
