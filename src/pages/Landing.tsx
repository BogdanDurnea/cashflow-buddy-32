import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { guides } from "@/data/guides";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import {
  Wallet,
  ScanLine,
  PieChart,
  Fingerprint,
  Bell,
  Globe,
  Target,
  FileText,
  ShieldCheck,
  ArrowRight,
  Download,
} from "lucide-react";

// Android APK stored in Lovable Cloud storage (private bucket, signed link on demand).
const APK_BUCKET = "app-downloads";
const APK_PATH = "cashflow-buddy.apk";

const features = [
  {
    icon: ScanLine,
    title: "Scanare AI a bonurilor",
    text: "Fotografiezi bonul, iar AI-ul extrage suma, comerciantul și categoria automat.",
  },
  {
    icon: PieChart,
    title: "Bugete inteligente",
    text: "Bugete lunare și pe categorii, cu alerte când te apropii de limită.",
  },
  {
    icon: Target,
    title: "Obiective de economii",
    text: "Setează ținte de economisire și urmărește progresul lună de lună.",
  },
  {
    icon: FileText,
    title: "Rapoarte și export",
    text: "Rapoarte PDF avansate, export CSV și linkuri de partajare cu expirare.",
  },
  {
    icon: Fingerprint,
    title: "Blocare biometrică",
    text: "Amprentă sau Face ID pentru a proteja accesul la datele tale financiare.",
  },
  {
    icon: Bell,
    title: "Memento facturi",
    text: "Notificări pentru facturi recurente, ca să nu mai ratezi nicio scadență.",
  },
];

export default function Landing() {
  const { user } = useAuth();

  useSEO({
    title: "CashFlow Buddy — Aplicație de finanțe personale cu AI",
    description:
      "Urmărește venituri și cheltuieli, setează bugete, scanează bonuri cu AI și generează rapoarte. Aplicație de finanțe personale, disponibilă în 9 limbi.",
  });

  const [apkLoading, setApkLoading] = useState(false);

  const handleApkDownload = async () => {
    setApkLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(APK_BUCKET)
        .createSignedUrl(APK_PATH, 300, { download: "cashflow-buddy.apk" });
      if (error || !data?.signedUrl) throw error ?? new Error("no url");
      window.location.href = data.signedUrl;
    } catch {
      toast({
        title: "Descărcarea nu a pornit",
        description: "Încearcă din nou în câteva momente.",
        variant: "destructive",
      });
    } finally {
      setApkLoading(false);
    }
  };

  const primaryCta = user
    ? { to: "/dashboard", label: "Deschide dashboard-ul" }
    : { to: "/auth", label: "Începe gratuit" };

  return (
    <main className="min-h-screen w-full bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                Finanțe personale, simplu și sigur
              </div>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                CashFlow Buddy — controlul complet asupra banilor tăi
              </h1>
              <p className="text-lg text-muted-foreground">
                Adaugă tranzacții în câteva secunde, scanează bonuri cu AI, setează bugete
                și vezi exact unde se duc banii — pe telefon și pe web.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={primaryCta.to}>{primaryCta.label}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/install">Instalează aplicația</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <a href="#ghiduri">Citește ghidurile</a>
                </Button>
              </div>
              <div>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleApkDownload}
                  disabled={apkLoading}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  {apkLoading ? "Se pregătește..." : "Descarcă pentru Android (.apk)"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Fără card bancar. Datele tale rămân private și criptate.
              </p>
            </div>
            <div>
              <img
                src={heroDashboard}
                alt="Dashboard CashFlow Buddy cu grafice de venituri, cheltuieli și bugete"
                width={1200}
                height={800}
                className="w-full rounded-xl border shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Tot ce îți trebuie într-o singură aplicație</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          De la înregistrarea unei cafele până la raportul anual — CashFlow Buddy acoperă
          întregul flux financiar personal.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="h-full">
              <CardContent className="space-y-3 pt-6">
                <div className="inline-flex rounded-lg bg-primary/10 p-2">
                  <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Cum funcționează</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Creezi contul", "Email și parolă, în mai puțin de un minut."],
              ["Adaugi tranzacțiile", "Manual, prin import CSV sau scanând bonurile cu AI."],
              ["Urmărești și optimizezi", "Bugete, grafice, rapoarte și recomandări AI."],
            ].map(([title, text], i) => (
              <li key={title} className="space-y-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold sm:text-3xl">Confidențialitate din start</h2>
            <p className="text-muted-foreground">
              Datele sunt stocate criptat, accesul este restricționat la contul tău, iar
              aplicația poate fi blocată suplimentar cu amprentă sau Face ID. Îți poți
              șterge contul și toate datele oricând, direct din aplicație.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/privacy" className="inline-flex items-center gap-2 text-primary hover:underline">
                <ShieldCheck className="h-4 w-4" /> Politica de confidențialitate
              </Link>
              <Link to="/terms" className="inline-flex items-center gap-2 text-primary hover:underline">
                <FileText className="h-4 w-4" /> Termeni și condiții
              </Link>
            </div>
          </div>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="inline-flex rounded-lg bg-primary/10 p-2">
                <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">Disponibil în 9 limbi</h3>
              <p className="text-sm text-muted-foreground">
                Română, engleză, franceză, germană, spaniolă, italiană, portugheză,
                olandeză și poloneză — interfața și conținutul dinamic sunt traduse.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guides */}
      <section id="ghiduri" className="scroll-mt-16 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Ghiduri de finanțe personale</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Resurse practice despre cum îți urmărești cheltuielile, cum îți construiești
            bugetul și ce indicatori merită urmăriți lunar.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {guides.map((g) => (
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
                  <Link to={g.to} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Citește ghidul <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Începe să economisești din prima lună</h2>
          <p className="mt-3 text-muted-foreground">
            Creează-ți contul gratuit și vezi imediat unde se duc banii tăi.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to={primaryCta.to}>{primaryCta.label}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CashFlow Buddy · Bogdan Durnea</p>
      </footer>
    </main>
  );
}
