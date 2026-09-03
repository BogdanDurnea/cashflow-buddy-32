import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { relatedGuides } from "@/data/guides";
import { SITE_URL, ogImageFor } from "@/data/seoRoutes";

const SITE = SITE_URL;


export interface SeoSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoContentPageProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  path: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
}

export function SeoContentPage({
  icon: Icon,
  eyebrow,
  title,
  intro,
  seoTitle,
  seoDescription,
  path,
  sections,
  faqs,
}: SeoContentPageProps) {
  const { user } = useAuth();
  const related = relatedGuides(path);
  const url = `${SITE}${path}`;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: url,
    ogType: "article",
    image: ogImageFor(path).url,
    imageAlt: ogImageFor(path).alt,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Ghiduri", item: `${SITE}/#ghiduri` },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
    ],
  });

  const cta = user
    ? { to: "/dashboard", label: "Deschide dashboard-ul" }
    : { to: "/auth", label: "Începe gratuit" };

  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Înapoi la pagina principală
        </Link>

        <header className="mt-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            {eyebrow}
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
          <p className="text-lg text-muted-foreground">{intro}</p>
        </header>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="text-muted-foreground">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-muted-foreground">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold">Întrebări frecvente</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <CardContent className="space-y-2 pt-6">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-xl border bg-muted/30 p-6 text-center">
          <h2 className="text-xl font-semibold">Pune-le în practică în CashFlow Buddy</h2>
          <p className="mt-2 text-muted-foreground">
            Cont gratuit, fără card bancar. Datele tale rămân private.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link to={cta.to}>{cta.label}</Link>
          </Button>
        </section>

        <section aria-labelledby="ghiduri-similare" className="mt-12">
          <h2 id="ghiduri-similare" className="text-2xl font-semibold">
            Ghiduri similare
          </h2>
          <p className="mt-2 text-muted-foreground">
            Continuă cu celelalte ghiduri din seria de finanțe personale.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {related.map((g) => (
              <Card key={g.to} className="h-full">
                <CardContent className="space-y-3 pt-6">
                  <div className="inline-flex rounded-lg bg-primary/10 p-2">
                    <g.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">
                    <Link to={g.to} className="hover:text-primary hover:underline">
                      {g.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">{g.text}</p>
                  <Link
                    to={g.to}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Citește ghidul <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link
            to="/#ghiduri"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Vezi toate ghidurile <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

      </article>
    </main>
  );
}
