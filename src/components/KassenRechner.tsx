import { useState, useMemo } from 'react'
import { BASE } from '../lib/base-url'
import {
  berechne,
  euro,
  euroRund,
  FESTBETRAG_ERSTES_OHR,
  FESTBETRAG_ZWEITES_OHR,
  FESTBETRAG_HOCHGRADIG,
  ZUZAHLUNG_PRO_GERAET,
  type Anzahl,
  type Versicherung,
} from '../lib/kasse'

interface Product {
  slug: string
  name: string
  hersteller: string
  familie: string
  technologie: string
  privatpreis: number
  kassenpreis: number
  bild: string
}

export default function KassenRechner({ products }: { products: Product[] }) {
  const [versicherung, setVersicherung] = useState<Versicherung>('gesetzlich')
  const [anzahl, setAnzahl] = useState<Anzahl>(2)
  const [hochgradig, setHochgradig] = useState(false)
  const [slug, setSlug] = useState(products[0]?.slug ?? '')

  const product = products.find(p => p.slug === slug) ?? products[0]
  const r = useMemo(
    () => berechne(product.privatpreis, anzahl, versicherung, hochgradig),
    [product.privatpreis, anzahl, versicherung, hochgradig]
  )

  const gesetzlich = versicherung === 'gesetzlich'

  const gruppen = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of products) {
      const key = `${p.hersteller} ${p.familie}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return [...map.entries()]
  }, [products])

  return (
    <div className="kr">
      <div className="kr-form">
        <div className="kr-field">
          <label className="kr-label" htmlFor="kr-versicherung">Wie sind Sie versichert?</label>
          <div className="kr-toggle-group" id="kr-versicherung">
            <button
              type="button"
              className={`kr-toggle ${gesetzlich ? 'kr-toggle-active' : ''}`}
              onClick={() => setVersicherung('gesetzlich')}
              aria-pressed={gesetzlich}
            >
              Gesetzlich
            </button>
            <button
              type="button"
              className={`kr-toggle ${!gesetzlich ? 'kr-toggle-active' : ''}`}
              onClick={() => setVersicherung('privat')}
              aria-pressed={!gesetzlich}
            >
              Privat / Selbstzahler
            </button>
          </div>
        </div>

        <div className="kr-field">
          <label className="kr-label" htmlFor="kr-anzahl">Wie viele Ohren werden versorgt?</label>
          <div className="kr-toggle-group" id="kr-anzahl">
            <button
              type="button"
              className={`kr-toggle ${anzahl === 1 ? 'kr-toggle-active' : ''}`}
              onClick={() => setAnzahl(1)}
              aria-pressed={anzahl === 1}
            >
              Ein Ohr
            </button>
            <button
              type="button"
              className={`kr-toggle ${anzahl === 2 ? 'kr-toggle-active' : ''}`}
              onClick={() => setAnzahl(2)}
              aria-pressed={anzahl === 2}
            >
              Beide Ohren
            </button>
          </div>
        </div>

        <div className="kr-field">
          <label className="kr-label" htmlFor="kr-geraet">Welches Hörgerät?</label>
          <select id="kr-geraet" value={slug} onChange={e => setSlug(e.target.value)} className="kr-select">
            {gruppen.map(([familie, items]) => (
              <optgroup key={familie} label={familie}>
                {items.map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} — {euroRund(p.privatpreis)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {gesetzlich && (
          <label className="kr-check">
            <input
              type="checkbox"
              checked={hochgradig}
              onChange={e => setHochgradig(e.target.checked)}
            />
            <span>
              <strong>Hochgradige Schwerhörigkeit</strong>
              <span className="kr-check-hint">Ab WHO-Grad 4 zahlt die Kasse einen höheren Festbetrag. Ihr HNO-Arzt hält das im Rezept fest.</span>
            </span>
          </label>
        )}
      </div>

      <div className="kr-result">
        <div className="kr-result-head">
          <span className="kr-result-label">Ihr Eigenanteil</span>
          <span className="kr-result-sum">{euroRund(r.gesamt)}</span>
          <span className="kr-result-sub">
            {anzahl === 2 ? 'für beide Ohren' : 'für ein Ohr'} — {product.name}
          </span>
        </div>

        <div className="kr-rows">
          <div className="kr-row">
            <span>{anzahl === 2 ? `Gerätepreis (2 × ${euroRund(product.privatpreis)})` : 'Gerätepreis'}</span>
            <span className="kr-num">{euro(r.listenpreis)}</span>
          </div>

          {gesetzlich && (
            <>
              <div className="kr-row kr-row-minus">
                <span>
                  Festbetrag Ihrer Krankenkasse
                  {anzahl === 2 && !hochgradig && (
                    <span className="kr-row-hint">
                      {euro(FESTBETRAG_ERSTES_OHR)} + {euro(FESTBETRAG_ZWEITES_OHR)} für das zweite Gerät
                    </span>
                  )}
                  {hochgradig && (
                    <span className="kr-row-hint">
                      {euro(FESTBETRAG_HOCHGRADIG)} pro Ohr bei WHO-Grad 4
                    </span>
                  )}
                </span>
                <span className="kr-num">− {euro(r.festbetrag)}</span>
              </div>
              <div className="kr-row">
                <span>
                  Gesetzliche Zuzahlung
                  <span className="kr-row-hint">{euro(ZUZAHLUNG_PRO_GERAET)} pro Gerät, § 33 SGB V</span>
                </span>
                <span className="kr-num">+ {euro(r.zuzahlung)}</span>
              </div>
            </>
          )}

          <div className="kr-row kr-row-total">
            <span>Sie zahlen</span>
            <span className="kr-num">{euro(r.gesamt)}</span>
          </div>
        </div>

        {gesetzlich && r.festbetrag > 0 && (
          <div className="kr-saving">
            Ihre Krankenkasse übernimmt {euroRund(r.festbetrag)} — das sind{' '}
            {Math.round((r.festbetrag / r.listenpreis) * 100)} % des Gerätepreises.
          </div>
        )}

        {!gesetzlich && (
          <div className="kr-saving kr-saving-neutral">
            Private Krankenversicherungen erstatten je nach Tarif — häufig den vollen Betrag.
            Reichen Sie unsere Rechnung einfach bei Ihrer Versicherung ein.
          </div>
        )}

        <div className="kr-actions">
          <a href={`${BASE}hoergeraete/${product.slug}/`} className="kr-btn kr-btn-primary">
            {product.name} ansehen
          </a>
          <a href={`${BASE}hoergeraete/`} className="kr-btn kr-btn-ghost">
            Alle Hörgeräte
          </a>
        </div>
      </div>

      <p className="kr-disclaimer">
        Die Festbeträge werden bundeseinheitlich vom GKV-Spitzenverband festgelegt und gelten bei allen
        gesetzlichen Krankenkassen gleichermaßen. Für die Kostenübernahme benötigen Sie eine Verordnung
        Ihres HNO-Arztes. Einzelne Kassen erstatten über den Festbetrag hinaus — die Berechnung ist ein
        Richtwert, keine verbindliche Zusage.
      </p>
    </div>
  )
}
