// Kassenleistung für Hörhilfen — Referenzwerte und Kalkulationsbasis.
//
// WICHTIG — zwei verschiedene Größen:
//
// 1. FESTBETRAG_* : die gesetzlichen Festbeträge des GKV-Spitzenverbands.
//    Bundeseinheitlich, identisch bei allen gesetzlichen Kassen.
//    Nur zur Information/Dokumentation — NICHT zur Preisberechnung.
//
// 2. KALKULATION_* : der Betrag, mit dem wir den Eigenanteil ausweisen.
//    Bewusst unter dem Festbetrag angesetzt. Grund: Die tatsächliche
//    Kassenleistung steht erst nach Genehmigung fest und kann geringer
//    ausfallen — etwa wenn die Wiederbeschaffungsfrist von sechs Jahren
//    noch läuft, die Verordnung abgelehnt wird oder die Kasse einen
//    abweichenden Vertragssatz ansetzt. Der Puffer sorgt dafür, dass der
//    Kunde nachträglich entlastet und nicht belastet wird.
//
// Jede Ausweisung eines so berechneten Betrags muss als "voraussichtlich"
// gekennzeichnet sein und den Vorbehalt nach AGB § 7 nennen.
//
// Quelle Festbeträge: Hilfsmittelverzeichnis GKV, Produktgruppe 13. Stand 2026.

/** Gesetzlicher Festbetrag erstes Gerät (Erwachsene, WHO-Grad 2–3). Referenz. */
export const FESTBETRAG_ERSTES_OHR = 784.94

/** Gesetzlicher Festbetrag zweites Gerät (20 % Abschlag). Referenz. */
export const FESTBETRAG_ZWEITES_OHR = 627.95

/** Gesetzlicher Festbetrag bei hochgradiger Schwerhörigkeit (WHO-Grad 4). Referenz. */
export const FESTBETRAG_HOCHGRADIG = 865.05

/** Kalkulationsbasis erstes Gerät — konservativ unter dem Festbetrag. */
export const KALKULATION_ERSTES_OHR = 700

/** Kalkulationsbasis zweites Gerät — konservativ, mit 20 % Abschlag. */
export const KALKULATION_ZWEITES_OHR = 560

/** Kalkulationsbasis bei hochgradiger Schwerhörigkeit, pro Ohr. */
export const KALKULATION_HOCHGRADIG = 770

/** Gesetzliche Zuzahlung nach § 33 Abs. 8 SGB V, pro Gerät. Feste Größe. */
export const ZUZAHLUNG_PRO_GERAET = 10

/**
 * Abzug für den ausgewiesenen "ab"-Kassenpreis auf Produktkarten.
 * Entspricht der Kalkulationsbasis für ein Gerät.
 */
export const KASSENABZUG_EIN_GERAET = KALKULATION_ERSTES_OHR

export type Versicherung = 'gesetzlich' | 'privat'
export type Anzahl = 1 | 2

export interface Berechnung {
  listenpreis: number
  /** Voraussichtliche Kassenleistung — nicht der gesetzliche Festbetrag. */
  kassenleistung: number
  zuzahlung: number
  eigenanteil: number
  /** Voraussichtlicher Gesamtbetrag für den Kunden. */
  gesamt: number
  /** Was der Kunde bei voller Ausschöpfung des Festbetrags zahlen würde. */
  gesamtBeiFestbetrag: number
  /** Mögliche Entlastung, wenn die Kasse den vollen Festbetrag zahlt. */
  moeglicheEntlastung: number
}

/**
 * Berechnet den voraussichtlichen Eigenanteil.
 *
 * Rechnet bewusst mit KALKULATION_* statt FESTBETRAG_*, damit der
 * ausgewiesene Betrag nachträglich eher sinkt als steigt. Der Rückgabewert
 * enthält zusätzlich `moeglicheEntlastung` — die Differenz zum vollen
 * Festbetrag, die dem Kunden transparent gezeigt werden kann.
 */
export function berechne(
  privatpreis: number,
  anzahl: Anzahl,
  versicherung: Versicherung,
  hochgradig = false
): Berechnung {
  const listenpreis = privatpreis * anzahl

  if (versicherung === 'privat') {
    return {
      listenpreis,
      kassenleistung: 0,
      zuzahlung: 0,
      eigenanteil: listenpreis,
      gesamt: listenpreis,
      gesamtBeiFestbetrag: listenpreis,
      moeglicheEntlastung: 0,
    }
  }

  const kalk = hochgradig
    ? KALKULATION_HOCHGRADIG * anzahl
    : KALKULATION_ERSTES_OHR + (anzahl === 2 ? KALKULATION_ZWEITES_OHR : 0)

  const fest = hochgradig
    ? FESTBETRAG_HOCHGRADIG * anzahl
    : FESTBETRAG_ERSTES_OHR + (anzahl === 2 ? FESTBETRAG_ZWEITES_OHR : 0)

  // Die Kasse zahlt nie mehr als den Gerätepreis.
  const kassenleistung = Math.min(kalk, listenpreis)
  const kassenleistungFest = Math.min(fest, listenpreis)

  const zuzahlung = ZUZAHLUNG_PRO_GERAET * anzahl
  const eigenanteil = Math.max(0, listenpreis - kassenleistung)
  const gesamt = eigenanteil + zuzahlung
  const gesamtBeiFestbetrag = Math.max(0, listenpreis - kassenleistungFest) + zuzahlung

  return {
    listenpreis,
    kassenleistung,
    zuzahlung,
    eigenanteil,
    gesamt,
    gesamtBeiFestbetrag,
    moeglicheEntlastung: Math.max(0, gesamt - gesamtBeiFestbetrag),
  }
}

/** Voraussichtlicher Kassenpreis eines einzelnen Geräts für Produktkarten. */
export function kassenpreisAb(privatpreis: number): number {
  return Math.max(0, privatpreis - KASSENABZUG_EIN_GERAET)
}

export function euro(betrag: number): string {
  return betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export function euroRund(betrag: number): string {
  return Math.round(betrag).toLocaleString('de-DE') + ' €'
}
