import type {
  BlogRow,
  CategoryRow,
  FormSubmissionRow,
  ReviewRow,
  SiteContentRow,
} from "../supabase/database.types";

// ==============================================================================
// Pricing Types (success-based recruitment fees, edited in Admin > Site Content)
// ==============================================================================

export type PricingRegion = "germany" | "international";

export interface PricingTier {
  id: string;
  region: PricingRegion;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  price_from: number; // EUR, net
  enabled: boolean;
}

export interface PricingItem {
  id: string;
  text_de: string;
  text_en: string;
}

export interface PricingContent {
  enabled: boolean;
  headline_de: string;
  headline_en: string;
  intro_de: string;
  intro_en: string;
  price_suffix_de: string;
  price_suffix_en: string;
  tiers: PricingTier[]; // display order = array order
  included: PricingItem[];
  addons: PricingItem[];
  principle_de: string;
  principle_en: string;
  candidate_note_de: string;
  candidate_note_en: string;
  disclaimer_de: string;
  disclaimer_en: string;
}

export const DEFAULT_PRICING: PricingContent = {
  enabled: false,
  headline_de: "Erfolgsbasierte Personalvermittlung",
  headline_en: "Success-Based Recruitment",
  intro_de: "Sie zahlen nur, wenn die Vermittlung erfolgreich ist und ein Arbeitsvertrag unterschrieben wurde.",
  intro_en: "You only pay when the recruitment is successful and an employment contract is signed.",
  price_suffix_de: "netto zzgl. MwSt.",
  price_suffix_en: "net, plus VAT",
  tiers: [
    {
      id: "de-standard",
      region: "germany",
      title_de: "Standard-Vermittlung",
      title_en: "Standard Recruitment",
      description_de: "Für kaufmännische, gewerbliche, Logistik- und vergleichbare Positionen.",
      description_en: "For commercial, industrial, logistics and similar positions.",
      price_from: 2500,
      enabled: true,
    },
    {
      id: "de-specialist",
      region: "germany",
      title_de: "Fach- & Spezialkräfte",
      title_en: "Skilled & Specialist Professionals",
      description_de: "Für qualifizierte Fachkräfte und anspruchsvollere Positionen.",
      description_en: "For qualified professionals and more demanding positions.",
      price_from: 3500,
      enabled: true,
    },
    {
      id: "intl-skilled",
      region: "international",
      title_de: "Internationale Fachkräfte",
      title_en: "International Skilled Professionals",
      description_de: "Vermittlung qualifizierter Mitarbeitender aus dem Ausland, inklusive Kandidatensuche und Vorauswahl.",
      description_en: "Recruitment of qualified employees from abroad, including candidate sourcing and pre-selection.",
      price_from: 4900,
      enabled: true,
    },
    {
      // Disabled until legally cleared: Ghana is on the WHO Health Workforce
      // Safeguards List (§ 38 BeschV restricts healthcare recruitment from there).
      id: "intl-ghana",
      region: "international",
      title_de: "Vermittlung aus Ghana",
      title_en: "Recruitment from Ghana",
      description_de: "Gezielte Suche und Vermittlung geeigneter Kandidatinnen und Kandidaten aus Ghana.",
      description_en: "Targeted search and recruitment of suitable candidates from Ghana.",
      price_from: 4900,
      enabled: false,
    },
    {
      id: "intl-healthcare",
      region: "international",
      title_de: "Gesundheits- & Pflegefachkräfte",
      title_en: "Healthcare & Nursing Professionals",
      description_de: "Für qualifizierte Fachkräfte in Gesundheit und Pflege.",
      description_en: "For qualified professionals in healthcare and nursing.",
      price_from: 5900,
      enabled: true,
    },
    {
      id: "intl-apprentices",
      region: "international",
      title_de: "Internationale Auszubildende",
      title_en: "International Apprentices",
      description_de: "Vermittlung geeigneter internationaler Bewerberinnen und Bewerber für Ausbildungsplätze.",
      description_en: "Recruitment of suitable international candidates for apprenticeship positions.",
      price_from: 3500,
      enabled: true,
    },
  ],
  included: [
    { id: "sourcing", text_de: "Kandidatensuche", text_en: "Candidate sourcing" },
    { id: "preselection", text_de: "Vorauswahl geeigneter Kandidaten", text_en: "Pre-selection of suitable candidates" },
    { id: "screening", text_de: "Prüfung der Bewerbungsunterlagen", text_en: "Application screening" },
    { id: "interviews", text_de: "Erstgespräche mit Kandidaten", text_en: "Initial candidate interviews" },
    { id: "presentation", text_de: "Vorstellung geeigneter Kandidaten", text_en: "Presentation of suitable candidates" },
    { id: "coordination", text_de: "Koordination der Vorstellungsgespräche", text_en: "Coordination of interviews" },
    { id: "support", text_de: "Begleitung während des gesamten Prozesses", text_en: "Support throughout the recruitment process" },
    { id: "documents", text_de: "Unterstützung bei der Dokumentenkoordination", text_en: "Assistance with document coordination" },
    { id: "communication", text_de: "Internationale Kommunikation", text_en: "International communication" },
  ],
  addons: [
    { id: "visa", text_de: "Visumsverfahren (§ 81a AufenthG)", text_en: "Visa processing (§ 81a AufenthG)" },
    { id: "recognition", text_de: "Anerkennung ausländischer Abschlüsse", text_en: "Recognition of foreign qualifications" },
    { id: "language", text_de: "Sprachkurse", text_en: "Language courses" },
    { id: "relocation", text_de: "Relocation & Wohnraumsuche", text_en: "Relocation & housing support" },
  ],
  principle_de: "Keine erfolgreiche Vermittlung = keine Vermittlungsgebühr.",
  principle_en: "No successful placement = no recruitment fee.",
  candidate_note_de: "Für Bewerberinnen und Bewerber fallen keine Vermittlungsgebühren an. Die Kosten trägt der Arbeitgeber.",
  candidate_note_en: "No recruitment fees for candidates. The recruitment costs are paid by the employer.",
  disclaimer_de:
    "Das finale Honorar richtet sich nach Position, Qualifikation und Umfang des Vermittlungsauftrags und wird vor Beginn transparent vereinbart.",
  disclaimer_en:
    "The final fee depends on the position, qualification and scope of the recruitment assignment and will be agreed transparently before the recruitment process begins.",
};

// ==============================================================================
// Initial Seed Data (Authentic German Healthcare Recruitment)
// ==============================================================================

export const DEFAULT_SITE_CONTENT = {
  hero: {
    title_de: "Ihr Tor zu einer Karriere in Deutschland",
    title_en: "Your Gateway to a Career in Germany",
    subtitle_de:
      "iPrince Personalvermittlung verbindet qualifizierte internationale Fachkräfte mit führenden deutschen Arbeitgebern – in allen Branchen und Berufsgruppen. 100% kostenfrei für Bewerber.",
    subtitle_en:
      "iPrince Recruiting connects qualified international professionals with leading German employers across all industries. 100% free placement for applicants.",
    findJobCta_de: "JOB FINDEN",
    findJobCta_en: "FIND A JOB",
    findStaffCta_de: "MITARBEITER FINDEN",
    findStaffCta_en: "FIND TALENT",
  },
  announcement: {
    enabled: true,
    text_de: "⚡ Professionelle Personalvermittlung für alle Branchen – von Pflege über IT bis Ingenieurwesen!",
    text_en: "⚡ Professional recruitment services across all industries – from healthcare to IT and engineering!",
    link: "/submit-cv",
  },
  company: {
    name: "iPrince Personalvermittlung",
    owner: "Prince I. (Managing Director)",
    address: "Königsallee 42, 40212 Düsseldorf, Deutschland",
    phone: "+49 (0) 211 9876 5432",
    whatsapp: "+49 176 1234 5678",
    email: "kontakt@iprince-recruiting.de",
    complianceBadge1: "Zugelassene Personalvermittlung nach § 299 SGB III",
    complianceBadge2: "Beschleunigtes Fachkräfteverfahren (§ 81a AufenthG)",
    complianceBadge3: "100% DSGVO-konforme Datenspeicherung in Frankfurt am Main",
  },
  services: [
    {
      id: "recruitment",
      title_de: "Professionelle Personalvermittlung",
      title_en: "Professional Recruitment",
      description_de: "Gezielte Besetzung von Vakanzen in allen Branchen – von Pflege über IT bis Ingenieurwesen.",
      description_en: "Targeted staffing across all industries – healthcare, IT, engineering, and more.",
      icon: "target",
    },
    {
      id: "fast_track",
      title_de: "Beschleunigtes Fachkräfteverfahren",
      title_en: "Fast-Track Visa Processing",
      description_de: "Behördliche Vertretung und Visumsabwicklung in Rekordzeit über § 81a AufenthG.",
      description_en: "Official consular representation and visa expediting under § 81a AufenthG.",
      icon: "zap",
    },
    {
      id: "language_relocation",
      title_de: "Sprachförderung & Relocation",
      title_en: "Language & Relocation Support",
      description_de: "Fachsprachkurse, Anerkennungsunterstützung und Wohnraumorganisation vor Ort.",
      description_en: "Professional language courses, qualification recognition, and housing assistance.",
      icon: "home",
    },
  ],
  pricing: DEFAULT_PRICING,
};

export const DEFAULT_CATEGORIES: CategoryRow[] = [
  {
    id: "cat-1",
    slug: "pflege-karriere",
    name_de: "Pflegefachkräfte & Karriere",
    name_en: "Nursing & Careers",
    description_de: "Alles rund um den Einstieg und Aufstieg im deutschen Gesundheitswesen.",
    description_en: "Insights, wages, and career paths in the German healthcare system.",
    color_badge: "#0B192C",
    icon: "briefcase",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    slug: "visum-und-behoerden",
    name_de: "Visum & § 81a Fast-Track",
    name_en: "Visa & § 81a Fast-Track",
    description_de: "Rechtliche Grundlagen, Defizitbescheid, Anerkennung und Botschaftstermine.",
    description_en: "Legal pathways, accelerated immigration, and credential recognition in Germany.",
    color_badge: "#D4AF37",
    icon: "shield",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    slug: "deutsch-lernen",
    name_de: "Deutsch & Telc B2 Pflege",
    name_en: "German Language & B2 Exam",
    description_de: "Tipps und Strategien für die medizinische Fachsprachenprüfung und B2 Telc.",
    description_en: "Preparation tips and vocabulary for B2 medical German certifications.",
    color_badge: "#10B981",
    icon: "book",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-4",
    slug: "leben-in-deutschland",
    name_de: "Leben & Ankommen in Deutschland",
    name_en: "Living & Integration in Germany",
    description_de: "Wohnungssuche, Bankkonto, Krankenversicherung und Willkommenskultur.",
    description_en: "Housing, banking, healthcare insurance, and cultural integration guides.",
    color_badge: "#6366F1",
    icon: "heart",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_BLOGS: BlogRow[] = [
  {
    id: "blog-1",
    slug: "beschleunigtes-fachkraefteverfahren-81a-leitfaden",
    title_de: "Das beschleunigte Fachkräfteverfahren (§ 81a AufenthG): In 4 Monaten zur Arbeitserlaubnis",
    title_en: "The Accelerated Fast-Track Visa (§ 81a): Work Permit in Germany in Just 4 Months",
    excerpt_de: "Wie internationale Pflegekräfte und deutsche Kliniken die Visum-Wartezeit von 18 Monaten auf unter 16 Wochen verkürzen.",
    excerpt_en: "How international nurses and German hospitals reduce embassy wait times from 18 months to under 16 weeks.",
    content_de: `## Was ist das beschleunigte Fachkräfteverfahren?

Das durch das Fachkräfteeinwanderungsgesetz (FEG) eingeführte **beschleunigte Fachkräfteverfahren nach § 81a AufenthG** revolutioniert die Anwerbung ausländischer Pflegefachkräfte. 

Anstatt monatelang auf Botschaftstermine im Herkunftsland zu warten, bevollmächtigt der Arbeitgeber oder die Agentur iPrince die zuständige Zentrale Ausländerbehörde in Deutschland.

### Die wichtigsten Vorteile auf einen Blick:
- **Priorisierte Bearbeitung:** Feste Fristen für Anerkennungsstellen und die Bundesagentur für Arbeit.
- **Schneller Visumstermin:** Botschaften müssen innerhalb von 3 Wochen einen Termin zur Visumsantragstellung vergeben.
- **Vorabzustimmung:** Das Visum wird direkt bei Vorlage der Vorabzustimmung erteilt.

### Welche Unterlagen werden benötigt?
1. Beglaubigte Übersetzung des Pflege-Diploms
2. Nachweis über Deutschkenntnisse (mindestens B1, idealerweise B2)
3. Vollmacht für das § 81a Verfahren
4. Konkretes Arbeitsvertragsangebot einer deutschen Klinik

iPrince übernimmt für alle betreuten Pflegekräfte die komplette bürokratische Koordination ohne jegliche Kosten für die Fachkraft.`,
    content_en: `## What is the Accelerated Skilled Worker Procedure?

The **accelerated procedure under § 81a AufenthG** fundamentally speeds up the relocation process for qualified international nurses.

Instead of waiting up to 18 months for an embassy appointment, the employer or iPrince coordinates directly with the Central Immigration Authority in Germany.

### Key Advantages:
- **Legally Binding Timelines:** Fast turnaround by credential recognition authorities and the Federal Employment Agency.
- **Priority Embassy Slots:** Consular offices must provide interview slots within 3 weeks of approval.
- **Preliminary Approval (Vorabzustimmung):** Guarantees swift visa issuance.

iPrince manages the entire documentation and legal filing at zero charge to the applicant nurse.`,
    category_id: "cat-2",
    featured_image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    author_name: "Prince I.",
    author_role: "Geschäftsführer / Founder",
    author_avatar: null,
    read_time_minutes: 5,
    language: "both",
    status: "published",
    is_featured: true,
    views: 342,
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "blog-2",
    slug: "telc-b2-pflege-tipps-bestehen",
    title_de: "Erfolgreich durch die Telc B2 Deutschprüfung für Pflegekräfte",
    title_en: "How to Ace the Telc B2 German Nursing Language Exam",
    excerpt_de: "Praktische Übungen, typische Pflege-Fachbegriffe und Strategien für den mündlichen Prüfungsteil.",
    excerpt_en: "Practical test exercises, essential medical vocabulary, and oral exam strategies for foreign nurses.",
    content_de: `## Der Schlüssel zur Berufserlaubnis in Deutschland: Deutsch B2

Für die Erteilung der staatlichen Berufsurkunde als Pflegefachfrau bzw. Pflegefachmann in Deutschland ist das Sprachzertifikat **B2 Pflege** (oder telc B2 allgemein) die unverzichtbare Voraussetzung.

### Worauf legen Prüfer besonderen Wert?
- **Patientenorientierte Kommunikation:** Empathisches Erklären von Pflegemaßnahmen.
- **Übergabegespräche (SBAR-Schema):** Präzise Schilderung von Vitalwerten und Beobachtungen an Kollegen und Ärzte.
- **Pflegedokumentation:** Korrekte schriftliche Aufzeichnungen von Dekubitus-Risiken, Medikationsgabe und Wundversorgung.

### Unser Tipp:
Nutzen Sie unsere kostenfreien Vorbereitungskurse und Hospitationsgespräche, um typische Redewendungen im Krankenhausalltag sicher einzuüben.`,
    content_en: `## The Key to Your German Nursing License: B2 German

To obtain your full German professional license (*Berufsurkunde*), the **B2 level certificate** is mandatory across all 16 German federal states.

### Core Focus Areas:
- **Patient Communication:** Compassionate bedside explanations.
- **Handover Reports:** Structured briefings between shift nurses and medical doctors.
- **Medical Documentation:** Accurate record keeping of medication, wound status, and vital signs.`,
    category_id: "cat-3",
    featured_image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    author_name: "Sarah K.",
    author_role: "Leiterin Sprache & Integration",
    author_avatar: null,
    read_time_minutes: 4,
    language: "both",
    status: "published",
    is_featured: false,
    views: 218,
    published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "blog-3",
    slug: "gehalt-und-schichtzuschlaege-in-deutschen-kliniken",
    title_de: "Was verdient eine Pflegekraft in Deutschland wirklich? Gehalt & Zuschläge erklärt",
    title_en: "Real Nursing Salaries in Germany: Tarifverträge, Shift Allowances & Benefits",
    excerpt_de: "TVöD-P Tabelle, Nacht- und Sonntagszuschläge sowie 13. Monatsgehalt transparent aufgeschlüsselt.",
    excerpt_en: "A clear breakdown of TVöD collective agreements, night shift bonuses, and 13th month salary payments.",
    content_de: `## Transparenz beim Verdienst: Tarifvertrag Öffentlicher Dienst (TVöD-P)

In Deutschland sind die meisten Krankenhäuser und Universitätskliniken an Tarifverträge gebunden. Pflegekräfte profitieren von transparenten Gehaltsstrukturen und gesetzlichen Schutzvorschriften.

### Durchschnittliches Einstiegsgehalt:
- **Grundgehalt (TVöD-P 7 / P 8):** ca. 3.400 € bis 4.100 € brutto pro Monat.
- **Schicht- & Nachtzuschläge:** Steuerfreie Zulagen zwischen 15% und 50% pro Nacht-/Sonntagsstunde.
- **Jahressonderzahlung:** Ein 13. Gehalt (Weihnachtsgeld) im November.
- **Urlaub:** Mindestens 30 bezahlte Urlaubstage pro Jahr.`,
    content_en: `## Transparent Compensation: Public Sector Collective Agreement (TVöD-P)

German public hospitals and university clinics operate under transparent collective bargaining structures.

### Average Starting Compensation:
- **Base Monthly Salary:** €3,400 to €4,100 gross.
- **Tax-Free Shift Allowances:** Additional 15% to 50% per hour for night, Sunday, and holiday shifts.
- **13th Month Bonus:** Special annual bonus paid every November.
- **Paid Vacation:** At least 30 working days of paid annual leave.`,
    category_id: "cat-1",
    featured_image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80",
    author_name: "Prince I.",
    author_role: "Geschäftsführer / Founder",
    author_avatar: null,
    read_time_minutes: 6,
    language: "both",
    status: "published",
    is_featured: false,
    views: 512,
    published_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

export const DEFAULT_SUBMISSIONS: FormSubmissionRow[] = [
  {
    id: "sub-1",
    form_type: "candidate_cv",
    status: "new",
    full_name: "Maria Santos",
    email: "maria.santos@example.com",
    phone: "+63 917 555 0192",
    company_name: null,
    profession: "Intensiv- & Anästhesiepflege (ICU)",
    language_level: "B2 Telc bestanden",
    experience_years: "4 Jahre",
    notes: "Defizitbescheid aus NRW liegt bereits vor. Ich suche eine Vollzeitstelle auf einer interdisziplinären Intensivstation im Raum Düsseldorf oder Köln.",
    resume_url: "https://example.com/resumes/maria_santos_cv.pdf",
    form_payload: {
      currentCountry: "Philippinen",
      availableFrom: "2026-11-01",
      hospitalPreference: "Universitätsklinik",
    },
    admin_notes: null,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "sub-2",
    form_type: "employer_request",
    status: "new",
    full_name: "Dr. Markus Weber",
    email: "markus.weber@klinikum-rheinland.de",
    phone: "+49 211 555 7890",
    company_name: "Klinikum Rheinland gGmbH",
    profession: "OP-Pflege & Anästhesie",
    language_level: "Mindestens B2",
    experience_years: "2+ Jahre",
    notes: "Wir haben akuten Bedarf an 6 examinierten Pflegefachkräften für unseren zentralen Operationstrakt. Eigene Personalwohnungen stehen bereit. Schnelle Abwicklung über § 81a erwünscht.",
    resume_url: null,
    form_payload: {
      department: "Zentral-OP",
      numberOfPositions: 6,
      housingProvided: true,
      urgency: "High",
    },
    admin_notes: null,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "sub-3",
    form_type: "contact_inquiry",
    status: "contacted",
    full_name: "Amira Ben Youssef",
    email: "amira.by@example.com",
    phone: "+216 20 123 456",
    company_name: null,
    profession: "Allgemeine Krankenpflege",
    language_level: "B1 Goethe (B2 in Vorbereitung)",
    experience_years: "3 Jahre",
    notes: "Guten Tag, ich möchte wissen, ob iPrince auch Kandidaten aus Tunesien betreut und die Kosten für den Anpassungslehrgang übernimmt. Vielen Dank!",
    resume_url: null,
    form_payload: {
      inquiryTopic: "Ablauf & Kostenübernahme",
    },
    admin_notes: "Am 16.09. per WhatsApp kontaktiert und Informationsbroschüre sowie Zoom-Termin geschickt.",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
];

export const DEFAULT_REVIEWS: ReviewRow[] = [
  {
    id: "rev-1",
    author_name: "Liezel Fernandez",
    role_title: "Intensivfachkraft (ITS)",
    clinic_name: "Universitätsklinikum Düsseldorf",
    author_avatar: "https://images.unsplash.com/photo-1594824813576-928ef784e1b1?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    review_text_de:
      "Vom ersten Gespräch in Manila bis zur Schlüsselübergabe meiner Klinikwohnung in Düsseldorf war iPrince immer an meiner Seite. Kein einziger Cent Gebühr, echte Wertschätzung und reibungslose Visabeschaffung über § 81a!",
    review_text_en:
      "From my first meeting in Manila to receiving the keys to my clinic apartment in Düsseldorf, iPrince was always there. Zero placement fees, true respect, and seamless visa processing!",
    verified: true,
    is_featured: true,
    status: "approved",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "rev-2",
    author_name: "Christoph Bäumer",
    role_title: "Pflegedirektor",
    clinic_name: "Evangelisches Krankenhaus Köln",
    author_avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    review_text_de:
      "iPrince ist für unser Haus ein verlässlicher Partner auf Augenhöhe. Die vermittelten Pflegekräfte sprechen exzellentes Deutsch, besitzen fundierte Vorkenntnisse und sind dank der professionellen Begleitung sofort einsatzfähig.",
    review_text_en:
      "iPrince is a trusted partner for our hospital. The recruited nursing candidates speak outstanding German, bring solid clinical expertise, and integrate smoothly into our team.",
    verified: true,
    is_featured: true,
    status: "approved",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "rev-3",
    author_name: "Elena Popescu",
    role_title: "Fachkraft für Anästhesie & OP",
    clinic_name: "Klinikum Essen",
    author_avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    review_text_de:
      "Der Defizitausgleich und die Begleitung zur Kenntnisprüfung waren erstklassig organisiert. Ich habe mich zu keinem Zeitpunkt allein gefühlt. Große Empfehlung für alle Pflegekräfte im Ausland!",
    review_text_en:
      "The adaptation course and preparation for the recognition exam were top notch. I never felt alone. Highly recommended to any nurse planning to work in Germany!",
    verified: true,
    is_featured: true,
    status: "approved",
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
];

// ==============================================================================
// Persistent Local Storage & In-Memory Store
// ==============================================================================

const STORAGE_KEYS = {
  SITE_CONTENT: "iprince_site_content_v1",
  CATEGORIES: "iprince_categories_v1",
  BLOGS: "iprince_blogs_v1",
  SUBMISSIONS: "iprince_submissions_v1",
  REVIEWS: "iprince_reviews_v1",
};

// Server-side fallback memory cache
let serverSiteContent = { ...DEFAULT_SITE_CONTENT };
let serverCategories: CategoryRow[] = [...DEFAULT_CATEGORIES];
let serverBlogs: BlogRow[] = [...DEFAULT_BLOGS];
let serverSubmissions: FormSubmissionRow[] = [...DEFAULT_SUBMISSIONS];
let serverReviews: ReviewRow[] = [...DEFAULT_REVIEWS];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getLocalData<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, data: T): void {
  if (isBrowser()) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to write to localStorage", e);
    }
  }
}

// Check if Supabase credentials are valid
export function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anon && !url.includes("your-project") && !anon.includes("your-anon-key"));
}

// ==============================================================================
// CMS Data Service Methods
// ==============================================================================

export const cmsService = {
  // --- Site Content ---
  getSiteContent(): typeof DEFAULT_SITE_CONTENT {
    if (isBrowser()) {
      // Backfill sections added after the content was first saved (e.g. pricing)
      return { ...DEFAULT_SITE_CONTENT, ...getLocalData(STORAGE_KEYS.SITE_CONTENT, DEFAULT_SITE_CONTENT) };
    }
    return serverSiteContent;
  },

  updateSiteContent(newContent: Partial<typeof DEFAULT_SITE_CONTENT>) {
    const current = this.getSiteContent();
    const updated = {
      ...current,
      ...newContent,
      hero: { ...current.hero, ...(newContent.hero || {}) },
      announcement: { ...current.announcement, ...(newContent.announcement || {}) },
      company: { ...current.company, ...(newContent.company || {}) },
      pricing: { ...current.pricing, ...(newContent.pricing || {}) },
    };
    if (isBrowser()) {
      setLocalData(STORAGE_KEYS.SITE_CONTENT, updated);
      window.dispatchEvent(new Event("iprince_content_updated"));
    }
    serverSiteContent = updated;
    return updated;
  },

  // --- Categories ---
  getCategories(): CategoryRow[] {
    if (isBrowser()) {
      return getLocalData(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    return serverCategories;
  },

  saveCategory(cat: Omit<CategoryRow, "id" | "created_at" | "updated_at"> & { id?: string }): CategoryRow {
    const categories = this.getCategories();
    const now = new Date().toISOString();
    let saved: CategoryRow;

    if (cat.id && categories.some((c) => c.id === cat.id)) {
      saved = {
        ...categories.find((c) => c.id === cat.id)!,
        ...cat,
        updated_at: now,
      };
      const updated = categories.map((c) => (c.id === cat.id ? saved : c));
      if (isBrowser()) setLocalData(STORAGE_KEYS.CATEGORIES, updated);
      serverCategories = updated;
    } else {
      saved = {
        ...cat,
        id: cat.id || `cat-${Date.now()}`,
        created_at: now,
        updated_at: now,
      };
      const updated = [saved, ...categories];
      if (isBrowser()) setLocalData(STORAGE_KEYS.CATEGORIES, updated);
      serverCategories = updated;
    }
    return saved;
  },

  deleteCategory(id: string): void {
    const updated = this.getCategories().filter((c) => c.id !== id);
    if (isBrowser()) setLocalData(STORAGE_KEYS.CATEGORIES, updated);
    serverCategories = updated;
  },

  // --- Blogs ---
  getBlogs(options?: { categoryId?: string; status?: string; search?: string }): BlogRow[] {
    let blogs = isBrowser()
      ? getLocalData(STORAGE_KEYS.BLOGS, DEFAULT_BLOGS)
      : serverBlogs;

    if (options?.categoryId) {
      blogs = blogs.filter((b) => b.category_id === options.categoryId);
    }
    if (options?.status && options.status !== "all") {
      blogs = blogs.filter((b) => b.status === options.status);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      blogs = blogs.filter(
        (b) =>
          b.title_de.toLowerCase().includes(q) ||
          b.title_en.toLowerCase().includes(q) ||
          b.excerpt_de?.toLowerCase().includes(q) ||
          b.excerpt_en?.toLowerCase().includes(q)
      );
    }
    return blogs;
  },

  getBlogBySlug(slug: string): BlogRow | undefined {
    const blogs = this.getBlogs();
    return blogs.find((b) => b.slug === slug);
  },

  getBlogById(id: string): BlogRow | undefined {
    const blogs = this.getBlogs();
    return blogs.find((b) => b.id === id);
  },

  saveBlog(blog: Partial<BlogRow> & { title_de: string; title_en: string }): BlogRow {
    const blogs = this.getBlogs();
    const now = new Date().toISOString();
    let saved: BlogRow;

    if (blog.id && blogs.some((b) => b.id === blog.id)) {
      const existing = blogs.find((b) => b.id === blog.id)!;
      saved = {
        ...existing,
        ...blog,
        slug:
          blog.slug ||
          blog.title_en
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, ""),
        updated_at: now,
        published_at:
          blog.status === "published" && !existing.published_at ? now : existing.published_at,
      };
      const updated = blogs.map((b) => (b.id === blog.id ? saved : b));
      if (isBrowser()) setLocalData(STORAGE_KEYS.BLOGS, updated);
      serverBlogs = updated;
    } else {
      const generatedSlug =
        blog.slug ||
        blog.title_en
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      saved = {
        id: blog.id || `blog-${Date.now()}`,
        slug: generatedSlug,
        title_de: blog.title_de,
        title_en: blog.title_en,
        excerpt_de: blog.excerpt_de || null,
        excerpt_en: blog.excerpt_en || null,
        content_de: blog.content_de || "",
        content_en: blog.content_en || "",
        category_id: blog.category_id || null,
        featured_image:
          blog.featured_image ||
          "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
        author_name: blog.author_name || "Prince I.",
        author_role: blog.author_role || "Founder & Director",
        author_avatar: blog.author_avatar || null,
        read_time_minutes: blog.read_time_minutes || 4,
        language: blog.language || "both",
        status: blog.status || "published",
        is_featured: blog.is_featured ?? false,
        views: blog.views ?? 0,
        published_at: blog.status === "published" ? now : null,
        created_at: now,
        updated_at: now,
      };
      const updated = [saved, ...blogs];
      if (isBrowser()) setLocalData(STORAGE_KEYS.BLOGS, updated);
      serverBlogs = updated;
    }
    return saved;
  },

  deleteBlog(id: string): void {
    const updated = this.getBlogs().filter((b) => b.id !== id);
    if (isBrowser()) setLocalData(STORAGE_KEYS.BLOGS, updated);
    serverBlogs = updated;
  },

  // --- Form Submissions Inbox ---
  getSubmissions(options?: { type?: string; status?: string; search?: string }): FormSubmissionRow[] {
    let submissions = isBrowser()
      ? getLocalData(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS)
      : serverSubmissions;

    if (options?.type && options.type !== "all") {
      submissions = submissions.filter((s) => s.form_type === options.type);
    }
    if (options?.status && options.status !== "all") {
      submissions = submissions.filter((s) => s.status === options.status);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      submissions = submissions.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.company_name && s.company_name.toLowerCase().includes(q)) ||
          (s.profession && s.profession.toLowerCase().includes(q))
      );
    }
    return submissions;
  },

  createSubmission(payload: Omit<FormSubmissionRow, "id" | "created_at" | "updated_at">): FormSubmissionRow {
    const submissions = this.getSubmissions();
    const now = new Date().toISOString();
    const newEntry: FormSubmissionRow = {
      ...payload,
      id: `sub-${Date.now()}`,
      status: payload.status || "new",
      created_at: now,
      updated_at: now,
    };
    const updated = [newEntry, ...submissions];
    if (isBrowser()) {
      setLocalData(STORAGE_KEYS.SUBMISSIONS, updated);
    }
    serverSubmissions = updated;
    return newEntry;
  },

  updateSubmissionStatus(
    id: string,
    status: FormSubmissionRow["status"],
    adminNotes?: string
  ): FormSubmissionRow | undefined {
    const submissions = this.getSubmissions();
    const target = submissions.find((s) => s.id === id);
    if (!target) return undefined;

    const updatedEntry: FormSubmissionRow = {
      ...target,
      status,
      admin_notes: adminNotes !== undefined ? adminNotes : target.admin_notes,
      updated_at: new Date().toISOString(),
    };
    const updatedList = submissions.map((s) => (s.id === id ? updatedEntry : s));
    if (isBrowser()) {
      setLocalData(STORAGE_KEYS.SUBMISSIONS, updatedList);
    }
    serverSubmissions = updatedList;
    return updatedEntry;
  },

  deleteSubmission(id: string): void {
    const updated = this.getSubmissions().filter((s) => s.id !== id);
    if (isBrowser()) setLocalData(STORAGE_KEYS.SUBMISSIONS, updated);
    serverSubmissions = updated;
  },

  // --- Customer Reviews Moderation ---
  getReviews(options?: { status?: string; isFeatured?: boolean }): ReviewRow[] {
    let reviews = isBrowser()
      ? getLocalData(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS)
      : serverReviews;

    if (options?.status && options.status !== "all") {
      reviews = reviews.filter((r) => r.status === options.status);
    }
    if (options?.isFeatured !== undefined) {
      reviews = reviews.filter((r) => r.is_featured === options.isFeatured);
    }
    return reviews;
  },

  createReview(payload: Omit<ReviewRow, "id" | "created_at" | "updated_at">): ReviewRow {
    const reviews = this.getReviews();
    const now = new Date().toISOString();
    const newEntry: ReviewRow = {
      ...payload,
      id: `rev-${Date.now()}`,
      status: payload.status || "pending",
      created_at: now,
      updated_at: now,
    };
    const updated = [newEntry, ...reviews];
    if (isBrowser()) {
      setLocalData(STORAGE_KEYS.REVIEWS, updated);
    }
    serverReviews = updated;
    return newEntry;
  },

  updateReview(id: string, updates: Partial<ReviewRow>): ReviewRow | undefined {
    const reviews = this.getReviews();
    const target = reviews.find((r) => r.id === id);
    if (!target) return undefined;

    const updatedEntry: ReviewRow = {
      ...target,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const updatedList = reviews.map((r) => (r.id === id ? updatedEntry : r));
    if (isBrowser()) {
      setLocalData(STORAGE_KEYS.REVIEWS, updatedList);
    }
    serverReviews = updatedList;
    return updatedEntry;
  },

  deleteReview(id: string): void {
    const updated = this.getReviews().filter((r) => r.id !== id);
    if (isBrowser()) setLocalData(STORAGE_KEYS.REVIEWS, updated);
    serverReviews = updated;
  },
};
