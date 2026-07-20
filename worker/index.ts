import { scrapeAndUpdatePrices } from './price-scraper'

// Anfragen werden bewusst nicht in einer Datenbank abgelegt. Die Mail an den
// Betrieb ist der Datensatz — sie enthält alle Angaben, die Angebotsnummer
// steht im Betreff, und nachgereichte Unterlagen hängen später am selben
// Thread. Deshalb gilt: Geht diese Mail nicht raus, ist die Anfrage verloren
// und der Kunde muss das erfahren.

interface Env {
  ADMIN_SECRET: string
  SITE_URL: string
  GITHUB_TOKEN: string
  RESEND_API_KEY: string
  /** Postfach des anpassenden Akustikers — hier laufen die Anfragen auf. */
  BETRIEB_EMAIL: string
  /** Absenderadresse, muss bei Resend als Domain verifiziert sein. */
  ABSENDER_EMAIL: string
  /** Telefonnummer für den Fehlerfall. */
  BETRIEB_TELEFON: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

// Zeichensatz ohne verwechselbare Zeichen — die Nummer wird abgetippt,
// vorgelesen und handschriftlich notiert. Muss mit src/lib/referenz.ts
// übereinstimmen.
const ALPHABET = '23479ACDEFGHJKMNPQRTUVWXYZ'

function angebotsnummer(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const z = [...bytes].map(b => ALPHABET[b % ALPHABET.length])
  return `EO-${z.slice(0, 3).join('')}-${z.slice(3).join('')}`
}

/**
 * Versendet eine Mail über Resend. Wirft nie — der Aufrufer bekommt das
 * Ergebnis als Text zurück ("ok" oder eine Fehlerbeschreibung) und
 * entscheidet, wie schwer der Fehlschlag wiegt.
 */
async function sendMail(
  env: Env,
  opts: { to: string; subject: string; html: string; replyTo?: string }
): Promise<string> {
  if (!env.RESEND_API_KEY) return 'kein API-Key hinterlegt'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.ABSENDER_EMAIL || 'easyOhr <noreply@easyohr.de>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    })
    const data = (await res.json().catch(() => null)) as any
    if (res.ok && data?.id) return 'ok'
    return `Fehler ${res.status}: ${data?.message || data?.name || 'unbekannt'}`
  } catch (e) {
    return `Netzwerkfehler: ${e instanceof Error ? e.message : 'unbekannt'}`
  }
}

function escapeHtml(wert: unknown): string {
  return String(wert ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const MAX_GERAETE = 2

const VERSICHERUNG_TEXT: Record<string, string> = {
  gesetzlich: 'Gesetzlich versichert',
  privat: 'Privat versichert / Selbstzahler',
}

const REZEPT_TEXT: Record<string, string> = {
  'noch-nicht': 'Noch keine Verordnung — Beratung gewünscht',
  ja: 'Verordnung liegt vor',
  termin: 'HNO-Termin steht bevor',
}

function betriebsMail(nr: string, k: any, artikel: any[], summe: number): string {
  const zeilen = artikel
    .map(
      a =>
        `<tr><td style="padding:6px 12px 6px 0">${escapeHtml(a.hersteller)} ${escapeHtml(a.name)}<br>
         <span style="color:#666;font-size:13px">Farbe: ${escapeHtml(a.farbe)}${a.menge > 1 ? ` · ${a.menge} Geräte` : ''}</span></td>
         <td style="padding:6px 0;text-align:right;white-space:nowrap">${(a.privatpreis * a.menge).toLocaleString('de-DE')} €</td></tr>`
    )
    .join('')

  const feld = (label: string, wert: unknown) =>
    wert ? `<tr><td style="padding:4px 16px 4px 0;color:#666">${label}</td><td style="padding:4px 0">${escapeHtml(wert)}</td></tr>` : ''

  return `<div style="font-family:system-ui,sans-serif;max-width:640px;color:#2C2C2A">
    <p style="font-size:13px;color:#666;margin:0 0 4px">Neue Angebotsanfrage über easyOhr</p>
    <h1 style="font-size:22px;margin:0 0 20px">${nr}</h1>

    <h2 style="font-size:15px;margin:24px 0 8px">Kunde</h2>
    <table style="font-size:14px;border-collapse:collapse">
      ${feld('Name', [k.anrede, k.vorname, k.nachname].filter(Boolean).join(' '))}
      ${feld('E-Mail', k.email)}
      ${feld('Telefon', k.telefon)}
      ${feld('Adresse', `${k.strasse}, ${k.plz} ${k.ort}`)}
    </table>

    <h2 style="font-size:15px;margin:24px 0 8px">Kostenübernahme</h2>
    <table style="font-size:14px;border-collapse:collapse">
      ${feld('Versicherung', VERSICHERUNG_TEXT[k.versicherung] || k.versicherung)}
      ${feld('Krankenkasse', k.krankenkasse)}
      ${feld('Verordnung', REZEPT_TEXT[k.rezept] || k.rezept)}
    </table>

    <h2 style="font-size:15px;margin:24px 0 8px">Auswahl</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      ${zeilen}
      <tr><td style="padding:10px 12px 0 0;border-top:1px solid #ddd;font-weight:600">Gerätepreis gesamt</td>
      <td style="padding:10px 0 0;border-top:1px solid #ddd;text-align:right;font-weight:600">${summe.toLocaleString('de-DE')} €</td></tr>
    </table>

    ${
      k.nachricht
        ? `<h2 style="font-size:15px;margin:24px 0 8px">Nachricht</h2>
           <p style="font-size:14px;background:#F5F3EF;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(k.nachricht)}</p>`
        : ''
    }

    <p style="font-size:13px;color:#666;margin-top:28px;padding-top:16px;border-top:1px solid #eee">
      Antwort an den Kunden geht direkt an ${escapeHtml(k.email)} — diese E-Mail kann beantwortet werden.
    </p>
  </div>`
}

function kundenMail(nr: string, k: any, artikel: any[], env: Env): string {
  const liste = artikel
    .map(a => `<li style="margin-bottom:4px">${escapeHtml(a.hersteller)} ${escapeHtml(a.name)} — ${escapeHtml(a.farbe)}${a.menge > 1 ? ` (${a.menge} Geräte)` : ''}</li>`)
    .join('')

  return `<div style="font-family:system-ui,sans-serif;max-width:600px;color:#2C2C2A;line-height:1.6">
    <p style="font-size:20px;font-weight:600;margin:0 0 16px">
      <span style="color:#2C2C2A">easy</span><span style="color:#0F6E56">Ohr</span>
    </p>

    <p>Guten Tag ${escapeHtml([k.anrede, k.nachname].filter(Boolean).join(' ') || k.vorname)},</p>
    <p>vielen Dank für Ihre Anfrage. Wir erstellen Ihr persönliches Angebot und melden uns
    innerhalb von 24 Stunden bei Ihnen.</p>

    <div style="background:#F5F3EF;border-radius:12px;padding:20px;margin:24px 0;text-align:center">
      <p style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Ihre Angebotsnummer</p>
      <p style="font-size:26px;font-weight:700;letter-spacing:2px;color:#0F6E56;margin:0">${nr}</p>
    </div>

    <p style="font-weight:600;margin-bottom:6px">Ihre Auswahl</p>
    <ul style="padding-left:20px;margin-top:0">${liste}</ul>

    <p style="font-weight:600;margin:28px 0 6px">Unterlagen nachreichen</p>
    <p style="margin-top:0">Für die Abrechnung mit Ihrer Krankenkasse benötigen wir die Verordnung
    Ihres HNO-Arztes. Sie haben zwei Möglichkeiten:</p>
    <ul style="padding-left:20px">
      <li style="margin-bottom:8px"><strong>Foto per E-Mail:</strong> Antworten Sie einfach auf diese
      E-Mail und hängen Sie ein Foto der Verordnung an. Ihre Angebotsnummer ist dann automatisch dabei.</li>
      <li><strong>Original per Post:</strong> Für die endgültige Abrechnung benötigen wir das Original.
      Bitte notieren Sie <strong>${nr}</strong> auf dem Umschlag.</li>
    </ul>

    <p style="font-size:13px;color:#666;margin-top:28px;padding-top:16px;border-top:1px solid #eee">
      Dies ist ein unverbindliches Angebot. Es entsteht kein Kaufvertrag und keine Zahlungspflicht.
      Bei Fragen erreichen Sie uns unter ${escapeHtml(env.BETRIEB_EMAIL || 'hi@hoffnungsohr.de')}.
    </p>
  </div>`
}

async function handleAngebot(request: Request, env: Env) {
  const body = (await request.json().catch(() => null)) as any
  const k = body?.kunde
  const artikel = body?.artikel

  if (!k?.email || !k?.vorname || !k?.nachname || !k?.telefon || !k?.strasse || !k?.plz || !k?.ort) {
    return json({ error: 'Bitte füllen Sie alle Pflichtfelder aus.' }, 400)
  }
  if (!k?.datenschutz) {
    return json({ error: 'Bitte stimmen Sie der Datenschutzerklärung zu.' }, 400)
  }
  if (!Array.isArray(artikel) || artikel.length === 0) {
    return json({ error: 'Ihre Auswahl ist leer.' }, 400)
  }

  const anzahl = artikel.reduce((s: number, a: any) => s + (a.menge || 1), 0)
  if (anzahl > MAX_GERAETE) {
    return json({ error: `Es sind maximal ${MAX_GERAETE} Geräte pro Anfrage möglich.` }, 400)
  }

  const nr = angebotsnummer()
  const summe = artikel.reduce((s: number, a: any) => s + a.privatpreis * (a.menge || 1), 0)

  const betrieb = env.BETRIEB_EMAIL || 'hi@hoffnungsohr.de'

  // Diese Mail zuerst und allein: Sie ist der Datensatz. Erst wenn sie
  // zugestellt ist, gilt die Anfrage als angenommen.
  const anBetrieb = await sendMail(env, {
    to: betrieb,
    subject: `Neue Anfrage ${nr} — ${k.vorname} ${k.nachname}`,
    html: betriebsMail(nr, k, artikel, summe),
    replyTo: k.email,
  })

  if (anBetrieb !== 'ok') {
    // Ohne Datenbank gäbe es hier keine zweite Kopie. Dem Kunden einen Erfolg
    // vorzuspielen, hiesse ihn auf eine Antwort warten zu lassen, die nie kommt.
    console.error(`Anfrage ${nr} nicht zustellbar: ${anBetrieb}`)
    return json(
      {
        error:
          `Ihre Anfrage konnte technisch nicht übermittelt werden. ` +
          `Bitte rufen Sie uns kurz an: ${env.BETRIEB_TELEFON || '0214 1234567'}. ` +
          `Wir nehmen Ihre Anfrage dann direkt auf.`,
      },
      502
    )
  }

  // Die Bestätigung an den Kunden ist Komfort, kein Datensatz. Scheitert sie,
  // liegt die Anfrage trotzdem beim Betrieb — der Kunde wird angerufen.
  const anKunde = await sendMail(env, {
    to: k.email,
    subject: `Ihre Anfrage bei easyOhr — ${nr}`,
    html: kundenMail(nr, k, artikel, env),
    replyTo: betrieb,
  })

  if (anKunde !== 'ok') {
    console.error(`Bestätigung für ${nr} nicht zustellbar: ${anKunde}`)
  }

  return json({ angebotsnummer: nr, bestaetigungGesendet: anKunde === 'ok' })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const path = new URL(request.url).pathname

    try {
      if (path === '/api/angebot' && request.method === 'POST') {
        return await handleAngebot(request, env)
      }
      if (path === '/api/prices/update' && request.method === 'POST') {
        if (request.headers.get('Authorization') !== `Bearer ${env.ADMIN_SECRET}`) {
          return json({ error: 'Unauthorized' }, 401)
        }
        return json({ log: await scrapeAndUpdatePrices(env) })
      }

      return json({ error: 'Not found' }, 404)
    } catch {
      return json({ error: 'Internal server error' }, 500)
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(scrapeAndUpdatePrices(env))
  },
}
