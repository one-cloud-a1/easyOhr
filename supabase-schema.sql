-- easyOhr — Schema für Angebotsanfragen
-- Im Supabase SQL Editor ausführen.
--
-- Der Table Editor von Supabase dient gleichzeitig als Dashboard: Anfragen
-- ansehen, nach Status filtern und den Status direkt in der Zeile ändern.

create table if not exists angebote (
  id bigint generated always as identity primary key,
  angebotsnummer text unique not null,

  -- neu → angebot_gesendet → unterlagen_offen → kasse_beantragt
  -- → geraet_versendet → testphase → abgeschlossen | storniert
  status text not null default 'neu',

  anrede text,
  vorname text not null,
  nachname text not null,
  email text not null,
  telefon text not null,
  strasse text not null,
  plz text not null,
  ort text not null,

  versicherung text,
  krankenkasse text,
  rezept_status text,
  nachricht text,

  artikel jsonb not null default '[]',
  geraetepreis numeric(10,2) not null default 0,

  -- "ok", wenn beide Benachrichtigungen rausgingen. Steht hier etwas anderes,
  -- wurde die Anfrage gespeichert, aber niemand benachrichtigt.
  mail_status text,

  -- Wird gesetzt, sobald die Verordnung vorliegt.
  unterlagen_erhalten_am timestamptz,
  -- Tatsächlicher Kassenanteil nach Genehmigung (siehe AGB § 7).
  kassenleistung numeric(10,2),
  notiz text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_angebote_nummer on angebote(angebotsnummer);
create index if not exists idx_angebote_status on angebote(status);
create index if not exists idx_angebote_email on angebote(email);

-- Anfragen enthalten Gesundheitsbezug (Art. 9 DSGVO): keinerlei Zugriff über
-- den öffentlichen anon-Key. Nur der Service-Role-Key des Workers und der
-- Table Editor im Dashboard kommen an die Daten.
alter table angebote enable row level security;

drop policy if exists "Nur Service Role" on angebote;
create policy "Nur Service Role"
  on angebote for all
  using (auth.role() = 'service_role');

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists angebote_updated_at on angebote;
create trigger angebote_updated_at
  before update on angebote
  for each row
  execute function update_updated_at();

-- Nachträglich ergänzte Spalten. Gefahrlos wiederholt ausführbar, damit eine
-- bereits angelegte Tabelle mit diesem Skript aktualisiert werden kann.
alter table angebote add column if not exists mail_status text;

-- Die Tabelle "orders" stammt aus dem Mollie-Checkout und wird nicht mehr
-- verwendet. Erst löschen, wenn dort nichts Wichtiges mehr steht:
-- drop table if exists orders;
