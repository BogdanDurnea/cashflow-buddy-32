import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";

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
  related: { to: string; label: string }[];
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
  related,
}: SeoContentPageProps) {
  const { user } = useAuth();
  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: `https://cashflow-buddy-32.lovable.app${path}`,
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

        <nav aria-label="Ghiduri conexe" className="mt-12">
          <h2 className="text-lg font-semibold">Continuă cu</h2>
          <ul className="mt-3 space-y-2">
            {related.map((r) => (
              <li key={r.to}>
                <Link to={r.to} className="inline-flex items-center gap-2 text-primary hover:underline">
                  {r.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </main>
  );
}
