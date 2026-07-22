// Warenkorb für Zubehör — bewusst getrennt vom Hörgeräte-Flow. Zubehör wird
// direkt gekauft (Versandkosten, Widerruf), nicht als Kassen-Anfrage.

export interface ZubehoerItem {
  /** Eindeutig pro Variante, z. B. "p312|60 Stück|evolution". */
  key: string
  name: string
  variante: string
  einzelpreis: number
  menge: number
  /** Ab dieser Menge gilt {@link staffelPreis} als Stückpreis (Mengenrabatt). */
  staffelAbMenge?: number
  /** Rabattierter Stückpreis ab {@link staffelAbMenge} Stück. */
  staffelPreis?: number
}

/**
 * Gültiger Stückpreis für eine Position — berücksichtigt den Mengenrabatt:
 * ab `staffelAbMenge` Stück gilt `staffelPreis`, sonst der normale Einzelpreis.
 */
export function stueckpreis(item: ZubehoerItem): number {
  if (item.staffelAbMenge && item.staffelPreis != null && item.menge >= item.staffelAbMenge) {
    return item.staffelPreis
  }
  return item.einzelpreis
}

const KEY = 'easyohr-zubehoer'
const EVENT = 'easyohr-zubehoer-update'

/** Kostenlos ab diesem Bestellwert, sonst Pauschale. */
export const VERSAND_FREI_AB = 49
export const VERSAND_PAUSCHALE = 5.9

export function getZubehoer(): ZubehoerItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(items: ZubehoerItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }))
}

export function addZubehoer(item: Omit<ZubehoerItem, 'menge'>, menge = 1) {
  const items = getZubehoer()
  const vorhanden = items.find(i => i.key === item.key)
  if (vorhanden) {
    vorhanden.menge += menge
  } else {
    items.push({ ...item, menge })
  }
  save(items)
}

export function setMenge(key: string, menge: number) {
  let items = getZubehoer()
  if (menge <= 0) {
    items = items.filter(i => i.key !== key)
  } else {
    const i = items.find(x => x.key === key)
    if (i) i.menge = menge
  }
  save(items)
}

export function clearZubehoer() {
  save([])
}

export function zwischensumme(items: ZubehoerItem[]): number {
  return items.reduce((s, i) => s + stueckpreis(i) * i.menge, 0)
}

export function versandkosten(zwischensumme: number): number {
  if (zwischensumme <= 0) return 0
  return zwischensumme >= VERSAND_FREI_AB ? 0 : VERSAND_PAUSCHALE
}

export function anzahlStueck(items: ZubehoerItem[]): number {
  return items.reduce((s, i) => s + i.menge, 0)
}

export function onZubehoerUpdate(cb: (items: ZubehoerItem[]) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}

export function euro(betrag: number): string {
  return betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
