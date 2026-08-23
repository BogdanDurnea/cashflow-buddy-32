import { FileText } from "lucide-react";
import { SeoContentPage } from "@/components/SeoContentPage";

export default function Reports() {
  return (
    <SeoContentPage
      icon={FileText}
      eyebrow="Ghid · Rapoarte financiare"
      title="Rapoarte financiare personale: ce să urmărești în fiecare lună"
      intro="Rapoartele transformă tranzacțiile în decizii. Iată indicatorii care contează cu adevărat și cum îi exporți sau îi partajezi în siguranță."
      seoTitle="Rapoarte financiare personale — ghid lunar | CashFlow Buddy"
      seoDescription="Ce indicatori urmărești lunar: sold net, rata de economisire, evoluția pe categorii. Export PDF și CSV plus linkuri de partajare cu expirare."
      path="/rapoarte-financiare"
      sections={[
        {
          heading: "Cei patru indicatori esențiali",
          paragraphs: [
            "Nu ai nevoie de zeci de grafice. Patru cifre îți spun aproape tot despre luna încheiată:",
          ],
          bullets: [
            "Sold net: venituri minus cheltuieli. Dacă este negativ două luni la rând, ai nevoie de o corecție structurală.",
            "Rata de economisire: procentul din venit pus deoparte. Un prag de 20% este o țintă solidă.",
            "Top 3 categorii de cheltuieli: acolo se află aproape întotdeauna cea mai mare economie posibilă.",
            "Variația față de luna anterioară: arată tendințele înainte să devină probleme.",
          ],
        },
        {
          heading: "Comparațiile lună de lună",
          paragraphs: [
            "O singură lună nu spune nimic — un concediu sau o reparație distorsionează media. Comparațiile pe mai multe luni separă cheltuielile excepționale de tiparele reale.",
            "Graficele de evoluție a soldului și trendurile pe categorii îți arată dacă o creștere este punctuală sau constantă.",
          ],
        },
        {
          heading: "Export PDF, CSV și partajare",
          paragraphs: [
            "Rapoartele pot fi exportate în PDF, cu sumar generat de AI și comparații între luni, sau în CSV pentru prelucrare proprie într-o foaie de calcul.",
            "Pentru contabil, partener sau consilier financiar, poți genera un link public de raport cu expirare între 1 și 90 de zile, revocabil oricând. Nu există linkuri permanente, tocmai pentru a limita expunerea datelor.",
          ],
        },
        {
          heading: "Ce faci cu concluziile",
          paragraphs: [
            "Un raport util produce o singură acțiune concretă pentru luna următoare: o limită nouă pe o categorie, un abonament anulat sau o sumă suplimentară direcționată către un obiectiv de economii.",
          ],
        },
      ]}
      faqs={[
        {
          question: "Pot genera rapoarte pentru o perioadă personalizată?",
          answer:
            "Da, poți filtra după interval de date și după categorii înainte de a exporta raportul în PDF sau CSV.",
        },
        {
          question: "Linkurile de raport partajat pot fi oprite?",
          answer:
            "Da. Fiecare link are o dată de expirare între 1 și 90 de zile și poate fi revocat manual în orice moment, moment în care devine inaccesibil.",
        },
        {
          question: "Ce conține sumarul generat de AI?",
          answer:
            "O sinteză a evoluției veniturilor și cheltuielilor, categoriile cu variații semnificative și observații despre tiparele din perioada analizată.",
        },
      ]}
    />
  );
}
