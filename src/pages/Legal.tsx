import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const CONTACT_NAME = "Bogdan Durnea";
const CONTACT_EMAIL = "bogdys_bboy@yahoo.com";
const APP_NAME = "CashFlow Buddy";
const EFFECTIVE_DATE = "14 iulie 2026";

type Lang = "ro" | "en";

interface LegalPageProps {
  variant: "privacy" | "terms";
}

export default function LegalPage({ variant }: LegalPageProps) {
  const [lang, setLang] = useState<Lang>("ro");
  const isPrivacy = variant === "privacy";

  useSEO({
    title: isPrivacy
      ? `${APP_NAME} — ${lang === "ro" ? "Politica de Confidențialitate" : "Privacy Policy"}`
      : `${APP_NAME} — ${lang === "ro" ? "Termeni și Condiții" : "Terms of Service"}`,
    description:
      lang === "ro"
        ? `${isPrivacy ? "Politica de confidențialitate" : "Termenii de utilizare"} pentru aplicația ${APP_NAME}.`
        : `${isPrivacy ? "Privacy policy" : "Terms of service"} for the ${APP_NAME} application.`,
  });

  const content = isPrivacy ? privacyContent[lang] : termsContent[lang];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {lang === "ro" ? "Înapoi" : "Back"}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              <button
                onClick={() => setLang("ro")}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                  lang === "ro" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                RO
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                  lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none py-8 px-6 sm:px-10">
            <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
            <p className="text-sm text-muted-foreground mb-8">
              {lang === "ro" ? "În vigoare de la" : "Effective from"}: {EFFECTIVE_DATE}
            </p>
            {content.sections.map((s, i) => (
              <section key={i} className="mb-6">
                <h2 className="text-xl font-semibold mt-6 mb-2">{s.heading}</h2>
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed text-muted-foreground mb-3 whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </section>
            ))}
            <hr className="my-8 border-border" />
            <p className="text-sm text-muted-foreground">
              {lang === "ro" ? "Contact:" : "Contact:"} <strong>{CONTACT_NAME}</strong> —{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              <Link to={isPrivacy ? "/terms" : "/privacy"} className="text-primary hover:underline">
                {isPrivacy
                  ? lang === "ro"
                    ? "Vezi Termenii și Condițiile"
                    : "See Terms of Service"
                  : lang === "ro"
                    ? "Vezi Politica de Confidențialitate"
                    : "See Privacy Policy"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

const privacyContent: Record<Lang, { title: string; sections: { heading: string; paragraphs: string[] }[] }> = {
  ro: {
    title: "Politica de Confidențialitate",
    sections: [
      {
        heading: "1. Introducere",
        paragraphs: [
          `Această politică de confidențialitate descrie modul în care ${APP_NAME} („noi", „aplicația") colectează, folosește și protejează datele tale personale atunci când utilizezi aplicația noastră de gestionare a finanțelor personale.`,
          `Prin utilizarea aplicației, ești de acord cu practicile descrise mai jos. Operator de date este ${CONTACT_NAME}, contactabil la ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "2. Datele pe care le colectăm",
        paragraphs: [
          `• Date de cont: adresa de email și parola (hash-uită, niciodată stocată în clar).\n• Date financiare introduse de tine: tranzacții, categorii, bugete, obiective de economisire, note.\n• Bonuri fiscale: imagini încărcate voluntar pentru OCR (procesate temporar, șterse după extragere).\n• Date tehnice: adresa IP, tipul dispozitivului, sistemul de operare, jurnale de erori.\n• Preferințe: limba, tema, setări de notificare.`,
          `Nu colectăm date de localizare precisă, contacte, mesaje SMS sau alte date sensibile în afara celor introduse voluntar de tine.`,
        ],
      },
      {
        heading: "3. Cum folosim datele",
        paragraphs: [
          `• Pentru a furniza funcționalitatea de bază (stocare tranzacții, generare rapoarte, sincronizare între dispozitive).\n• Pentru a genera analize și predicții AI pe baza tranzacțiilor tale (procesate prin Google Gemini prin Lovable AI Gateway).\n• Pentru a trimite notificări despre bugete, plăți recurente, obiective (doar dacă activezi această funcție).\n• Pentru a preveni abuzul (rate limiting, autentificare).\n• Pentru a respecta obligațiile legale.`,
        ],
      },
      {
        heading: "4. Bază legală (GDPR)",
        paragraphs: [
          `• Executarea contractului (art. 6(1)(b) GDPR) — pentru furnizarea serviciului.\n• Consimțământ (art. 6(1)(a)) — pentru notificări, analize AI, funcții biometrice.\n• Interes legitim (art. 6(1)(f)) — pentru securitate și prevenire abuz.\n• Obligații legale (art. 6(1)(c)) — pentru retenție fiscală, dacă e cazul.`,
        ],
      },
      {
        heading: "5. Partajarea datelor",
        paragraphs: [
          `Nu vindem și nu închiriem datele tale. Împărtășim date doar cu:\n• Supabase (infrastructură bază de date, autentificare, storage) — găzduit în UE.\n• Google Gemini prin Lovable AI Gateway — pentru analize AI și OCR bonuri.\n• Google Play Console — pentru statistici agregate ale aplicației.\n• Autorități competente, dacă suntem obligați legal.`,
          `Toți procesatorii au acorduri de prelucrare a datelor (DPA) semnate și respectă GDPR.`,
        ],
      },
      {
        heading: "6. Retenția datelor",
        paragraphs: [
          `Datele tale sunt păstrate atât timp cât contul este activ. La ștergerea contului (disponibilă în aplicație → Setări → Șterge cont), toate datele personale și financiare sunt șterse permanent în maximum 30 de zile. Jurnalele tehnice anonimizate pot fi păstrate până la 12 luni pentru securitate.`,
        ],
      },
      {
        heading: "7. Drepturile tale",
        paragraphs: [
          `Conform GDPR ai dreptul la:\n• Acces la datele tale.\n• Rectificare (corectare).\n• Ștergere („dreptul de a fi uitat").\n• Restricționarea prelucrării.\n• Portabilitate (export CSV/PDF disponibil în aplicație).\n• Opoziție.\n• Retragerea consimțământului oricând.\n• Depunerea unei plângeri la ANSPDCP (www.dataprotection.ro).`,
          `Pentru exercitarea drepturilor, contactează-ne la ${CONTACT_EMAIL}. Răspundem în maximum 30 de zile.`,
        ],
      },
      {
        heading: "8. Securitate",
        paragraphs: [
          `Folosim criptare TLS 1.3 în tranzit, Row Level Security la nivel de bază de date, rate limiting, autentificare cu parole hash-uite și blocare biometrică opțională. În ciuda măsurilor, niciun sistem nu este 100% sigur — te rugăm să folosești o parolă puternică și unică.`,
        ],
      },
      {
        heading: "9. Copii",
        paragraphs: [
          `Aplicația nu este destinată persoanelor sub 16 ani. Nu colectăm cu bună știință date de la copii. Dacă afli că un copil ne-a furnizat date, contactează-ne pentru ștergere imediată.`,
        ],
      },
      {
        heading: "10. Modificări",
        paragraphs: [
          `Putem actualiza această politică. Modificările majore vor fi anunțate prin email sau în aplicație cu minim 14 zile înainte de intrarea în vigoare.`,
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Introduction",
        paragraphs: [
          `This privacy policy describes how ${APP_NAME} ("we", "the app") collects, uses and protects your personal data when you use our personal finance management application.`,
          `By using the app, you agree to the practices described below. The data controller is ${CONTACT_NAME}, reachable at ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "2. Data we collect",
        paragraphs: [
          `• Account data: email address and password (hashed, never stored in clear text).\n• Financial data you enter: transactions, categories, budgets, savings goals, notes.\n• Receipts: images voluntarily uploaded for OCR (processed temporarily, deleted after extraction).\n• Technical data: IP address, device type, operating system, error logs.\n• Preferences: language, theme, notification settings.`,
          `We do not collect precise location, contacts, SMS messages or other sensitive data beyond what you voluntarily provide.`,
        ],
      },
      {
        heading: "3. How we use data",
        paragraphs: [
          `• To provide core functionality (transaction storage, report generation, cross-device sync).\n• To generate AI analytics and predictions from your transactions (processed via Google Gemini through the Lovable AI Gateway).\n• To send notifications about budgets, recurring payments, goals (only if enabled).\n• To prevent abuse (rate limiting, authentication).\n• To comply with legal obligations.`,
        ],
      },
      {
        heading: "4. Legal basis (GDPR)",
        paragraphs: [
          `• Contract performance (Art. 6(1)(b) GDPR) — to provide the service.\n• Consent (Art. 6(1)(a)) — for notifications, AI analytics, biometric features.\n• Legitimate interest (Art. 6(1)(f)) — for security and abuse prevention.\n• Legal obligations (Art. 6(1)(c)) — for tax retention where applicable.`,
        ],
      },
      {
        heading: "5. Data sharing",
        paragraphs: [
          `We do not sell or rent your data. We share data only with:\n• Supabase (database, auth, storage infrastructure) — hosted in the EU.\n• Google Gemini via Lovable AI Gateway — for AI analytics and receipt OCR.\n• Google Play Console — for aggregated app statistics.\n• Competent authorities, when legally required.`,
          `All processors have signed Data Processing Agreements (DPA) and comply with GDPR.`,
        ],
      },
      {
        heading: "6. Data retention",
        paragraphs: [
          `Your data is kept as long as your account is active. Upon account deletion (available in-app → Settings → Delete account), all personal and financial data is permanently deleted within 30 days. Anonymized technical logs may be retained up to 12 months for security purposes.`,
        ],
      },
      {
        heading: "7. Your rights",
        paragraphs: [
          `Under GDPR you have the right to:\n• Access your data.\n• Rectification.\n• Erasure ("right to be forgotten").\n• Restriction of processing.\n• Data portability (CSV/PDF export available in-app).\n• Object to processing.\n• Withdraw consent at any time.\n• Lodge a complaint with your national data protection authority.`,
          `To exercise your rights, contact us at ${CONTACT_EMAIL}. We respond within 30 days.`,
        ],
      },
      {
        heading: "8. Security",
        paragraphs: [
          `We use TLS 1.3 encryption in transit, Row Level Security at database level, rate limiting, hashed password authentication, and optional biometric lock. Despite these measures, no system is 100% secure — please use a strong and unique password.`,
        ],
      },
      {
        heading: "9. Children",
        paragraphs: [
          `The app is not intended for persons under 16. We do not knowingly collect data from children. If you learn that a child has provided us with data, contact us for immediate deletion.`,
        ],
      },
      {
        heading: "10. Changes",
        paragraphs: [
          `We may update this policy. Major changes will be announced by email or in-app at least 14 days before taking effect.`,
        ],
      },
    ],
  },
};

const termsContent: Record<Lang, { title: string; sections: { heading: string; paragraphs: string[] }[] }> = {
  ro: {
    title: "Termeni și Condiții",
    sections: [
      {
        heading: "1. Acceptarea termenilor",
        paragraphs: [
          `Prin crearea unui cont și utilizarea aplicației ${APP_NAME}, ești de acord cu acești Termeni și Condiții și cu Politica de Confidențialitate. Dacă nu ești de acord, te rugăm să nu utilizezi aplicația.`,
        ],
      },
      {
        heading: "2. Descrierea serviciului",
        paragraphs: [
          `${APP_NAME} este o aplicație de gestionare a finanțelor personale care îți permite să înregistrezi tranzacții, să creezi bugete, să setezi obiective de economisire, să scanezi bonuri fiscale cu AI și să generezi rapoarte. Aplicația NU oferă consultanță financiară, investițională sau fiscală profesională.`,
        ],
      },
      {
        heading: "3. Contul tău",
        paragraphs: [
          `Ești responsabil pentru păstrarea confidențialității parolei și pentru toate activitățile care au loc din contul tău. Trebuie să ne notifici imediat despre orice utilizare neautorizată. Trebuie să ai cel puțin 16 ani pentru a folosi aplicația.`,
        ],
      },
      {
        heading: "4. Utilizarea acceptabilă",
        paragraphs: [
          `Nu ai voie să:\n• Folosești aplicația pentru activități ilegale sau frauduloase.\n• Încerci să obții acces neautorizat la sistemele noastre.\n• Introduci date false ale altor persoane fără consimțământul lor.\n• Ocolești măsurile de securitate sau rate limiting.\n• Automatizezi cererile către aplicație fără permisiune scrisă.\n• Distribui, revinzi sau modifici aplicația.`,
        ],
      },
      {
        heading: "5. Conținutul utilizatorului",
        paragraphs: [
          `Datele pe care le introduci (tranzacții, note, bonuri) rămân proprietatea ta. Ne acorzi o licență limitată, non-exclusivă, pentru a stoca și procesa aceste date exclusiv în scopul furnizării serviciului.`,
        ],
      },
      {
        heading: "6. Funcții AI",
        paragraphs: [
          `Analizele AI (predicții, categorizare automată, OCR bonuri) sunt oferite „ca atare" și pot conține erori. Sunt orientative — nu iei decizii financiare importante bazându-te exclusiv pe ele. Nu suntem responsabili pentru pierderi rezultate din utilizarea rezultatelor AI.`,
        ],
      },
      {
        heading: "7. Disponibilitate",
        paragraphs: [
          `Depunem eforturi rezonabile pentru a menține aplicația disponibilă 24/7, dar nu garantăm funcționare neîntreruptă. Putem suspenda temporar serviciul pentru mentenanță sau motive tehnice.`,
        ],
      },
      {
        heading: "8. Ștergerea contului",
        paragraphs: [
          `Poți șterge contul oricând din Setări → Șterge cont. Ștergerea este permanentă și ireversibilă. Îți recomandăm să exporți datele înainte (funcția Export CSV/PDF).`,
          `Ne rezervăm dreptul de a suspenda sau șterge conturi care încalcă acești termeni.`,
        ],
      },
      {
        heading: "9. Limitarea răspunderii",
        paragraphs: [
          `În limitele legii aplicabile, ${APP_NAME} și ${CONTACT_NAME} nu sunt răspunzători pentru:\n• Pierderi financiare rezultate din utilizarea aplicației.\n• Erori în datele introduse manual sau extrase prin OCR.\n• Întreruperi ale serviciului.\n• Daune indirecte, incidentale sau consecvente.`,
          `Răspunderea totală este limitată la suma plătită de tine în ultimele 12 luni (dacă serviciul este gratuit, la 0 EUR).`,
        ],
      },
      {
        heading: "10. Modificări",
        paragraphs: [
          `Putem modifica acești termeni. Modificările majore vor fi anunțate cu minim 14 zile înainte. Utilizarea continuă a aplicației după modificare înseamnă acceptare.`,
        ],
      },
      {
        heading: "11. Legea aplicabilă",
        paragraphs: [
          `Acești termeni sunt guvernați de legea română. Orice dispută va fi rezolvată de instanțele competente din România.`,
        ],
      },
    ],
  },
  en: {
    title: "Terms of Service",
    sections: [
      {
        heading: "1. Acceptance of terms",
        paragraphs: [
          `By creating an account and using ${APP_NAME}, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.`,
        ],
      },
      {
        heading: "2. Service description",
        paragraphs: [
          `${APP_NAME} is a personal finance management application allowing you to record transactions, create budgets, set savings goals, scan receipts with AI and generate reports. The app does NOT provide professional financial, investment or tax advice.`,
        ],
      },
      {
        heading: "3. Your account",
        paragraphs: [
          `You are responsible for maintaining the confidentiality of your password and for all activities on your account. You must notify us immediately of any unauthorized use. You must be at least 16 years old to use the app.`,
        ],
      },
      {
        heading: "4. Acceptable use",
        paragraphs: [
          `You may not:\n• Use the app for illegal or fraudulent activities.\n• Attempt unauthorized access to our systems.\n• Enter false data of other persons without their consent.\n• Bypass security measures or rate limiting.\n• Automate requests without written permission.\n• Distribute, resell or modify the app.`,
        ],
      },
      {
        heading: "5. User content",
        paragraphs: [
          `Data you enter (transactions, notes, receipts) remains your property. You grant us a limited, non-exclusive license to store and process this data solely for the purpose of providing the service.`,
        ],
      },
      {
        heading: "6. AI features",
        paragraphs: [
          `AI analytics (predictions, automatic categorization, receipt OCR) are provided "as is" and may contain errors. They are indicative only — do not make important financial decisions based solely on them. We are not liable for losses resulting from AI outputs.`,
        ],
      },
      {
        heading: "7. Availability",
        paragraphs: [
          `We make reasonable efforts to keep the app available 24/7, but do not guarantee uninterrupted operation. We may temporarily suspend service for maintenance or technical reasons.`,
        ],
      },
      {
        heading: "8. Account deletion",
        paragraphs: [
          `You can delete your account at any time from Settings → Delete account. Deletion is permanent and irreversible. We recommend exporting your data first (CSV/PDF export feature).`,
          `We reserve the right to suspend or delete accounts violating these terms.`,
        ],
      },
      {
        heading: "9. Limitation of liability",
        paragraphs: [
          `To the extent permitted by law, ${APP_NAME} and ${CONTACT_NAME} are not liable for:\n• Financial losses resulting from app usage.\n• Errors in manually entered or OCR-extracted data.\n• Service interruptions.\n• Indirect, incidental or consequential damages.`,
          `Total liability is limited to the amount you paid in the last 12 months (if the service is free, to EUR 0).`,
        ],
      },
      {
        heading: "10. Changes",
        paragraphs: [
          `We may modify these terms. Major changes will be announced at least 14 days in advance. Continued use of the app after changes constitutes acceptance.`,
        ],
      },
      {
        heading: "11. Governing law",
        paragraphs: [
          `These terms are governed by Romanian law. Any dispute will be resolved by the competent courts in Romania.`,
        ],
      },
    ],
  },
};