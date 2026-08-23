import { Wallet } from "lucide-react";
import { SeoContentPage } from "@/components/SeoContentPage";

export default function ExpenseTracking() {
  return (
    <SeoContentPage
      icon={Wallet}
      eyebrow="Ghid · Urmărirea cheltuielilor"
      title="Urmărirea cheltuielilor: cum îți ții evidența banilor lună de lună"
      intro="Un sistem simplu de evidență a cheltuielilor îți arată exact unde se duc banii și îți dă control asupra bugetului, fără foi de calcul complicate."
      seoTitle="Urmărirea cheltuielilor — ghid practic | CashFlow Buddy"
      seoDescription="Cum îți urmărești cheltuielile zilnice: categorii, scanare bonuri cu AI, import CSV și analize lunare. Ghid practic din CashFlow Buddy."
      path="/urmarirea-cheltuielilor"
      sections={[
        {
          heading: "De ce contează evidența cheltuielilor",
          paragraphs: [
            "Majoritatea depășirilor de buget nu vin din achiziții mari, ci din cheltuieli mici și repetate care trec neobservate. Când fiecare tranzacție este înregistrată și încadrată într-o categorie, tiparele devin vizibile după doar câteva săptămâni.",
            "Obiectivul nu este să notezi totul perfect, ci să ai un flux atât de rapid încât să nu îl abandonezi după prima lună.",
          ],
        },
        {
          heading: "Trei metode de a înregistra o cheltuială",
          paragraphs: [
            "În CashFlow Buddy poți combina metodele, în funcție de context:",
          ],
          bullets: [
            "Adăugare manuală rapidă, cu scurtături pentru cheltuielile recurente (cafea, transport, abonamente).",
            "Scanarea bonului cu AI: aplicația extrage suma, comerciantul și propune categoria automat.",
            "Import CSV din extrasul bancar, pentru a recupera istoricul dintr-o singură operațiune.",
          ],
        },
        {
          heading: "Cum îți construiești categoriile",
          paragraphs: [
            "Începe cu 8–12 categorii largi (locuință, mâncare, transport, sănătate, divertisment, economii). Categoriile prea fine îngreunează raportarea, iar cele prea largi ascund problemele.",
            "Poți crea categorii personalizate și le poți ajusta oricând; tranzacțiile existente rămân editabile, așa că reorganizarea nu îți strică istoricul.",
          ],
        },
        {
          heading: "Rutina lunară care face diferența",
          paragraphs: [
            "Alocă 10 minute la finalul fiecărei luni pentru o verificare rapidă: tranzacții necategorizate, categorii care au crescut față de luna anterioară și abonamente pe care nu le mai folosești.",
          ],
          bullets: [
            "Verifică graficul pe categorii și compară cu luna precedentă.",
            "Marchează tranzacțiile recurente ca atare, ca să fie generate automat.",
            "Setează un buget pentru categoria care a depășit cel mai mult estimarea.",
          ],
        },
      ]}
      faqs={[
        {
          question: "Cât de des ar trebui să îmi înregistrez cheltuielile?",
          answer:
            "Ideal zilnic, în câteva secunde per tranzacție. Dacă preferi loturi, o sesiune de 5 minute la 2–3 zile este suficientă cât timp păstrezi bonurile sau folosești importul CSV.",
        },
        {
          question: "Pot urmări cheltuieli în mai multe monede?",
          answer:
            "Tranzacțiile sunt înregistrate în moneda configurată în setările contului, iar sumele din bonuri scanate pot fi editate manual înainte de salvare.",
        },
        {
          question: "Datele mele sunt private?",
          answer:
            "Da. Fiecare cont vede doar propriile tranzacții, accesul este restricționat la nivel de bază de date, iar aplicația poate fi blocată suplimentar cu amprentă sau Face ID.",
        },
      ]}
    />
  );
}
