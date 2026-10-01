-- Draft legal texts (2d). Generated from src/features/site-content/legal-draft.ts; legal-draft.test.ts keeps them equal.
-- In the migration, not seed.sql, because production runs db push without the seed. Never overwrites an edited row.
insert into public.site_content (key, value) values
  ('legal.imprint', jsonb_build_object('body', jsonb_build_object(
    'de', $imprint_de$
## Angaben gemäß § 5 DDG

[PLATZHALTER: Firmenname und Rechtsform]\
[PLATZHALTER: Straße und Hausnummer]\
[PLATZHALTER: PLZ und Ort]

**Vertreten durch:** [PLATZHALTER: Geschäftsführer/in]

## Kontakt

Telefon: [PLATZHALTER: Telefonnummer]\
E-Mail: [PLATZHALTER: E-Mail-Adresse]

## Registereintrag

Registergericht: [PLATZHALTER: Amtsgericht]\
Registernummer: [PLATZHALTER: HRB-Nummer]

## Umsatzsteuer-ID

Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [PLATZHALTER: USt-IdNr.]

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV

[PLATZHALTER: Name und Anschrift]

## Verbraucherstreitbeilegung

[PLATZHALTER: Hinweis nach § 36 VSBG anwaltlich prüfen lassen]
$imprint_de$,
    'en', $imprint_en$
## Information pursuant to § 5 DDG

[PLATZHALTER: company name and legal form]\
[PLATZHALTER: street and number]\
[PLATZHALTER: postcode and city]

**Represented by:** [PLATZHALTER: managing director]

## Contact

Phone: [PLATZHALTER: phone number]\
Email: [PLATZHALTER: email address]

## Register entry

Register court: [PLATZHALTER: local court]\
Register number: [PLATZHALTER: HRB number]

## VAT ID

VAT identification number pursuant to § 27a UStG: [PLATZHALTER: VAT ID]

## Responsible for content pursuant to § 18(2) MStV

[PLATZHALTER: name and address]

## Consumer dispute resolution

[PLATZHALTER: statement under § 36 VSBG, to be checked by a lawyer]

The German version of this page is legally binding.
$imprint_en$))),
  ('legal.privacy', jsonb_build_object('body', jsonb_build_object(
    'de', $privacy_de$
## 1. Verantwortlicher

[PLATZHALTER: Firmenname, Anschrift, E-Mail, Telefon]

## 2. Welche Daten wir verarbeiten

**Bewerbungen.** Wenn Sie sich über unser Bewerbungsformular bewerben, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, Ihre Telefonnummer, Ihre Antworten im Formular und die hochgeladenen Unterlagen, um Ihre Bewerbung zu prüfen und Ihnen passende Stellen zu vermitteln (Art. 6 Abs. 1 lit. b DSGVO).

**Arbeitgeberanfragen und Kontaktnachrichten.** Wenn Sie uns über das Anfrage- oder Kontaktformular schreiben, verarbeiten wir Ihre Angaben, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO, bei allgemeinen Anfragen Art. 6 Abs. 1 lit. f DSGVO).

**Missbrauchsschutz.** Damit unsere Formulare nicht massenhaft missbraucht werden, zählen wir Absendungen pro IP-Adresse. Diese Zähler werden nach etwa einem Tag gelöscht (Art. 6 Abs. 1 lit. f DSGVO).

**Server-Logdateien.** Beim Aufruf der Website verarbeitet unser Hosting-Anbieter technisch notwendige Daten wie IP-Adresse, Zeitpunkt und aufgerufene Seite, um die Website sicher bereitzustellen (Art. 6 Abs. 1 lit. f DSGVO).

## 3. Speicherdauer

- Begonnene, aber nicht abgesendete Bewerbungen und ihre Dateien löschen wir automatisch innerhalb von 48 Stunden.
- Kontaktnachrichten löschen wir automatisch 6 Monate nach der letzten Bearbeitung.
- Abgeschlossene oder archivierte Arbeitgeberanfragen löschen wir automatisch 12 Monate nach der letzten Bearbeitung.
- Abgesendete Bewerbungen: [PLATZHALTER: Speicherdauer festlegen]

## 4. Empfänger und Auftragsverarbeiter

- **Supabase** (Datenbank, Dateispeicher, Anmeldung für unser Team), Serverstandort in der EU [PLATZHALTER: Region bestätigen].
- **Vercel** (Hosting der Website). [PLATZHALTER: Drittlandübermittlung und Garantien, z. B. EU-US Data Privacy Framework]
- **Resend** (E-Mail-Benachrichtigungen an unser Team über neue Anfragen; die E-Mails enthalten keine Angaben aus dem Formular außer dem Firmennamen).
- **WhatsApp** (Meta Platforms Ireland Ltd.), nur wenn Sie uns über den WhatsApp-Link schreiben.
- **tawk.to** (Live-Chat), nur nach Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
- **CookieScript** (Verwaltung Ihrer Cookie-Einwilligung).

[PLATZHALTER: nicht genutzte Dienste entfernen]

## 5. Cookies und Einwilligung

Technisch notwendige Cookies setzen wir ohne Einwilligung. Den Live-Chat laden wir erst, wenn Sie in den Cookie-Einstellungen zugestimmt haben. Ihre Einwilligung können Sie jederzeit über „Cookie-Einstellungen" im Fußbereich der Seite widerrufen.

## 6. Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine Einwilligung jederzeit zu widerrufen. Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei [PLATZHALTER: zuständige Landesdatenschutzbehörde].

## 7. Stand

[PLATZHALTER: Datum]
$privacy_de$,
    'en', $privacy_en$
## 1. Controller

[PLATZHALTER: company name, address, email, phone]

## 2. What data we process

**Applications.** When you apply through our application form, we process your name, email address, phone number, your answers and the documents you upload to review your application and place you in suitable jobs (Art. 6(1)(b) GDPR).

**Employer enquiries and contact messages.** When you write to us through the enquiry or contact form, we process your details to answer you (Art. 6(1)(b) GDPR, for general questions Art. 6(1)(f) GDPR).

**Abuse protection.** To stop our forms being misused, we count submissions per IP address. These counters are deleted after about one day (Art. 6(1)(f) GDPR).

**Server log files.** When you visit the website, our hosting provider processes technically necessary data such as IP address, time and page requested to deliver the website securely (Art. 6(1)(f) GDPR).

## 3. How long we keep data

- Applications that were started but not sent, and their files, are deleted automatically within 48 hours.
- Contact messages are deleted automatically 6 months after they were last edited.
- Closed or archived employer enquiries are deleted automatically 12 months after they were last edited.
- Submitted applications: [PLATZHALTER: retention period]

## 4. Recipients and processors

- **Supabase** (database, file storage, sign-in for our team), servers in the EU [PLATZHALTER: confirm region].
- **Vercel** (website hosting). [PLATZHALTER: third-country transfer and safeguards, e.g. EU-US Data Privacy Framework]
- **Resend** (email notifications to our team about new enquiries; the emails contain no form data except the company name).
- **WhatsApp** (Meta Platforms Ireland Ltd.), only if you message us through the WhatsApp link.
- **tawk.to** (live chat), only after your consent (Art. 6(1)(a) GDPR).
- **CookieScript** (management of your cookie consent).

[PLATZHALTER: remove services that are not used]

## 5. Cookies and consent

We set technically necessary cookies without consent. The live chat only loads after you agree in the cookie settings. You can withdraw your consent at any time through "Cookie settings" in the page footer.

## 6. Your rights

You have the right to access, rectification, erasure, restriction of processing, data portability and objection, and to withdraw consent at any time. You can also complain to a data protection supervisory authority, for example [PLATZHALTER: competent state authority].

## 7. Last updated

[PLATZHALTER: date]

The German version of this page is legally binding.
$privacy_en$)))
on conflict (key) do nothing;
