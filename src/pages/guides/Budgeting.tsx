import { PieChart } from "lucide-react";
import { SeoContentPage } from "@/components/SeoContentPage";

export default function Budgeting() {
  return (
    <SeoContentPage
      icon={PieChart}
      eyebrow="Ghid · Bugetare"
      title="Buget personal: cum îl construiești și cum îl respecți"
      intro="Un buget bun nu îți interzice cheltuielile, ci le prioritizează. Iată cum îți setezi limite realiste pe categorii și cum le urmărești automat."
      seoTitle="Buget personal — cum îl faci și îl respecți | CashFlow Buddy"
      seoDescription="Ghid pentru bugetul personal: regula 50/30/20, bugete pe categorii, alerte de depășire și obiective de economii, cu exemple practice."
      path="/bugete-personale"
      sections={[
        {
          heading: "Pornește de la cifrele reale, nu de la estimări",
          paragraphs: [
            "Înainte de a stabili limite, ai nevoie de o lună sau două de cheltuieli înregistrate. Un buget construit pe presupuneri este depășit din prima săptămână și te descurajează.",
            "Folosește media ultimelor luni pentru fiecare categorie ca punct de plecare, apoi taie treptat acolo unde chiar poți.",
          ],
        },
        {
          heading: "Regula 50/30/20 ca structură de bază",
          paragraphs: [
            "O împărțire simplă a venitului net care funcționează pentru majoritatea bugetelor personale:",
          ],
          bullets: [
            "50% nevoi: chirie sau rată, utilități, mâncare de bază, transport, sănătate.",
            "30% dorințe: mese în oraș, abonamente, vacanțe, hobby-uri.",
            "20% economii și rambursarea datoriilor.",
          ],
        },
        {
          heading: "Bugete pe categorii și alerte",
          paragraphs: [
            "În CashFlow Buddy poți seta un buget lunar general și bugete separate pe categorii. Aplicația calculează consumul în timp real și te avertizează înainte să depășești limita, nu după.",
            "Bugetele partajate sunt utile pentru cheltuielile de familie sau de cuplu: mai multe persoane contribuie la aceeași limită, cu vizibilitate comună asupra consumului.",
          ],
        },
        {
          heading: "Transformă economiile într-un obiectiv concret",
          paragraphs: [
            "Un fond de urgență de 3–6 luni de cheltuieli este primul obiectiv rezonabil. Setează-l ca țintă de economii, cu o sumă lunară fixă, și tratează-l ca pe o factură obligatorie, nu ca pe ce rămâne la final de lună.",
          ],
          bullets: [
            "Definește ținta și termenul, iar aplicația calculează ritmul lunar necesar.",
            "Urmărește progresul vizual pentru fiecare obiectiv separat.",
            "Ajustează ținta când venitul se schimbă, în loc să abandonezi planul.",
          ],
        },
      ]}
      faqs={[
        {
          question: "Ce fac dacă depășesc bugetul într-o lună?",
          answer:
            "Nu resetezi tot planul. Identifici categoria responsabilă, verifici dacă a fost o cheltuială excepțională sau un tipar și ajustezi limita pentru luna următoare.",
        },
        {
          question: "Bugetele se resetează automat în fiecare lună?",
          answer:
            "Da, bugetele sunt calculate pe luna curentă, iar tranzacțiile recurente sunt luate în calcul pe măsură ce sunt generate.",
        },
        {
          question: "Pot avea un buget comun cu partenerul sau familia?",
          answer:
            "Da, prin bugetele partajate: inviți alte persoane la un buget și fiecare vede consumul comun, păstrând totuși propriile tranzacții private.",
        },
      ]}
      related={[
        { to: "/urmarirea-cheltuielilor", label: "Urmărirea cheltuielilor: ghid practic" },
        { to: "/rapoarte-financiare", label: "Rapoarte financiare: ce să urmărești lunar" },
      ]}
    />
  );
}
