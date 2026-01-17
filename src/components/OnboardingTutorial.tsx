import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Wallet, 
  PieChart, 
  Target, 
  Settings, 
  Sparkles,
  CheckCircle2,
  Receipt,
  Bell,
  TrendingUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bine ai venit în CashFlow Buddy!",
    description: "Suntem încântați să te avem alături. Acest tutorial te va ghida prin funcționalitățile principale ale aplicației pentru a-ți gestiona finanțele mai eficient.",
    icon: <Sparkles className="h-12 w-12 text-primary" />,
    tip: "Poți relua tutorialul oricând din Setări."
  },
  {
    id: "transactions",
    title: "Adaugă Tranzacții",
    description: "Înregistrează veniturile și cheltuielile tale rapid. Poți adăuga descrieri, categorii și chiar atașa bonuri fiscale pentru o evidență completă.",
    icon: <Receipt className="h-12 w-12 text-green-500" />,
    tip: "Folosește categoriile pentru a organiza mai bine cheltuielile."
  },
  {
    id: "analytics",
    title: "Vizualizează Analize",
    description: "Secțiunea Analize îți oferă grafice detaliate despre cum îți cheltuiești banii. Vezi tendințele pe categorii și evoluția balanței în timp.",
    icon: <PieChart className="h-12 w-12 text-blue-500" />,
    tip: "Graficele se actualizează automat cu fiecare tranzacție nouă."
  },
  {
    id: "budgets",
    title: "Setează Bugete",
    description: "Creează bugete lunare pentru a-ți controla cheltuielile. Primești alerte când te apropii de limită și poți urmări progresul în timp real.",
    icon: <Target className="h-12 w-12 text-orange-500" />,
    tip: "Setează bugete realiste bazate pe cheltuielile anterioare."
  },
  {
    id: "goals",
    title: "Obiective de Economisire",
    description: "Definește obiective de economisire și urmărește-ți progresul. Fie că economisești pentru vacanță sau pentru urgențe, aplicația te ajută să rămâi pe drumul cel bun.",
    icon: <TrendingUp className="h-12 w-12 text-purple-500" />,
    tip: "Împarte obiectivele mari în pași mai mici pentru motivație."
  },
  {
    id: "reminders",
    title: "Facturi și Mementouri",
    description: "Nu rata nicio plată! Setează mementouri pentru facturi recurente și primești notificări înainte de scadență.",
    icon: <Bell className="h-12 w-12 text-red-500" />,
    tip: "Activează notificările push pentru a nu rata nicio scadență."
  },
  {
    id: "complete",
    title: "Ești Pregătit!",
    description: "Acum cunoști funcționalitățile de bază. Explorează aplicația și începe să-ți gestionezi finanțele mai inteligent!",
    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    tip: "Verifică secțiunea Setări pentru mai multe opțiuni de personalizare."
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export const OnboardingTutorial = ({ onComplete, forceShow = false }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setCurrentStep(0);
      return;
    }

    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
    if (!hasCompletedOnboarding) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
    onComplete();
  };

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardHeader className="relative pb-2">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div
                  key={step.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="p-4 rounded-full bg-muted"
                >
                  {step.icon}
                </motion.div>
                
                <div className="space-y-2">
                  <CardTitle className="text-xl md:text-2xl">{step.title}</CardTitle>
                  <CardDescription className="text-sm md:text-base max-w-md">
                    {step.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {step.tip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{step.tip}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pasul {currentStep + 1} din {onboardingSteps.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Înapoi</span>
                </Button>

                <div className="flex gap-1.5">
                  {onboardingSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentStep 
                          ? "w-6 bg-primary" 
                          : index < currentStep 
                            ? "w-2 bg-primary/50" 
                            : "w-2 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  <span className="hidden sm:inline">
                    {currentStep === onboardingSteps.length - 1 ? "Finalizează" : "Următorul"}
                  </span>
                  {currentStep === onboardingSteps.length - 1 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {currentStep < onboardingSteps.length - 1 && (
                <Button
                  variant="link"
                  onClick={handleSkip}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Omite tutorialul
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
