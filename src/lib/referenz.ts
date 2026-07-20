// Angebotsnummer — die eindeutige Klammer um einen Vorgang.
//
// Sie steht in jeder E-Mail, auf dem Angebot und später auf dem Upload-Link.
// Dadurch lässt sich ein nachgereichtes Dokument eindeutig zuordnen, egal ob
// es per Foto, Post oder Telefon kommt.
//
// Zeichensatz ohne verwechselbare Zeichen (kein 0/O, 1/I/L, 5/S, 8/B) — die
// Nummer wird von Menschen abgetippt, vorgelesen und handschriftlich notiert.

const ALPHABET = '23479ACDEFGHJKMNPQRTUVWXYZ'

/** Erzeugt eine Angebotsnummer im Format EO-XXX-XXX. */
export function angebotsnummer(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const z = [...bytes].map(b => ALPHABET[b % ALPHABET.length])
  return `EO-${z.slice(0, 3).join('')}-${z.slice(3).join('')}`
}

/** Prüft, ob eine Zeichenkette dem Nummernformat entspricht. */
export function istAngebotsnummer(wert: string): boolean {
  return /^EO-[23479ACDEFGHJKMNPQRTUVWXYZ]{3}-[23479ACDEFGHJKMNPQRTUVWXYZ]{3}$/.test(
    wert.trim().toUpperCase()
  )
}
