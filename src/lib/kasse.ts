// Festbeträge der gesetzlichen Krankenversicherung für Hörhilfen.
// Bundeseinheitlich durch den GKV-Spitzenverband festgelegt — identisch bei allen
// gesetzlichen Kassen. Beträge inkl. MwSt., decken Gerät, Ohrpassstück und Anpassung ab.
// Quelle: Hilfsmittelverzeichnis GKV, Produktgruppe 13. Stand: 2026.

/** Festbetrag für das erste Gerät (Erwachsene, WHO-Grad 2–3). */
export const FESTBETRAG_ERSTES_OHR = 784.94

/** Zweites Gerät bei beidohriger Versorgung — 20 % Abschlag wegen geringerem Anpassaufwand. */
export const FESTBETRAG_ZWEITES_OHR = 627.95

/** Gesetzliche Zuzahlung nach § 33 Abs. 8 SGB V, pro Gerät. */
export const ZUZAHLUNG_PRO_GERAET = 10

/** Festbetrag bei hochgradiger Schwerhörigkeit (WHO-Grad 4), pro Ohr. */
export const FESTBETRAG_HOCHGRADIG = 865.05

export type Versicherung = 'gesetzlich' | 'privat'
export type Anzahl = 1 | 2

export interface Berechnung {
  listenpreis: number
  festbetrag: number
  zuzahlung: number
  eigenanteil: number
  gesamt: number
}

/**
 * Berechnet den Eigenanteil für eine Hörgeräteversorgung.
 * Bei privater Versicherung bzw. Selbstzahlern entfällt der Festbetrag —
 * private Kassen erstatten individuell nach Tarif, deshalb kein Abzug.
 */
export function berechne(
  privatpreis: number,
  anzahl: Anzahl,
  versicherung: Versicherung,
  hochgradig = false
): Berechnung {
  const listenpreis = privatpreis * anzahl

  if (versicherung === 'privat') {
    return { listenpreis, festbetrag: 0, zuzahlung: 0, eigenanteil: listenpreis, gesamt: listenpreis }
  }

  let festbetrag: number
  if (hochgradig) {
    festbetrag = FESTBETRAG_HOCHGRADIG * anzahl
  } else {
    festbetrag = FESTBETRAG_ERSTES_OHR + (anzahl === 2 ? FESTBETRAG_ZWEITES_OHR : 0)
  }

  // Der Festbetrag kann den Gerätepreis nicht übersteigen — die Kasse zahlt
  // höchstens den tatsächlichen Preis.
  festbetrag = Math.min(festbetrag, listenpreis)

  const zuzahlung = ZUZAHLUNG_PRO_GERAET * anzahl
  const eigenanteil = Math.max(0, listenpreis - festbetrag)

  return { listenpreis, festbetrag, zuzahlung, eigenanteil, gesamt: eigenanteil + zuzahlung }
}

export function euro(betrag: number): string {
  return betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export function euroRund(betrag: number): string {
  return Math.round(betrag).toLocaleString('de-DE') + ' €'
}
