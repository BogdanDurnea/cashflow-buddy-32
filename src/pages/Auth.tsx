import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

// Schema pentru validare email
const emailSchema = z.string()
  .trim()
  .min(1, { message: "Email-ul este obligatoriu" })
  .email({ message: "Adresa de email nu este validă" })
  .max(255, { message: "Email-ul nu poate depăși 255 de caractere" });

// Schema pentru validare parolă
const passwordSchema = z.string()
  .min(8, { message: "Parola trebuie să aibă cel puțin 8 caractere" })
  .max(72, { message: "Parola nu poate depăși 72 de caractere" })
  .regex(/[a-z]/, { message: "Parola trebuie să conțină cel puțin o literă mică" })
  .regex(/[A-Z]/, { message: "Parola trebuie să conțină cel puțin o literă mare" })
  .regex(/[0-9]/, { message: "Parola trebuie să conțină cel puțin o cifră" });

// Schema pentru login (parolă mai permisivă)
const loginPasswordSchema = z.string()
  .min(1, { message: "Parola este obligatorie" });

type AuthMode = "login" | "signup" | "forgot-password";

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateEmail = (value: string): boolean => {
    const result = emailSchema.safeParse(value);
    if (!result.success) {
      setErrors(prev => ({ ...prev, email: result.error.errors[0].message }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const validatePassword = (value: string, isLogin: boolean): boolean => {
    const schema = isLogin ? loginPasswordSchema : passwordSchema;
    const result = schema.safeParse(value);
    if (!result.success) {
      setErrors(prev => ({ ...prev, password: result.error.errors[0].message }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validare
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password, mode === "login");
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        toast.success("Autentificare reușită!");
        navigate("/");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        toast.success("Cont creat cu succes! Te poți autentifica acum.");
        setMode("login");
      }
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validare email
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success("Email de resetare trimis! Verifică-ți căsuța de email.");
      setMode("login");
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login":
        return "Bun venit înapoi!";
      case "signup":
        return "Creează cont nou";
      case "forgot-password":
        return "Resetare parolă";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login":
        return "Autentifică-te pentru a accesa aplicația";
      case "signup":
        return "Înregistrează-te pentru a începe";
      case "forgot-password":
        return "Introdu email-ul pentru a primi link-ul de resetare";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "forgot-password" ? (
            <>
            <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplu.ro"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    required
                    disabled={isLoading}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    "Trimite link de resetare"
                  )}
                </Button>
              </form>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline inline-flex items-center text-sm"
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Înapoi la autentificare
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplu.ro"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    required
                    disabled={isLoading}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Parolă</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot-password");
                          setErrors({});
                        }}
                        className="text-xs text-muted-foreground hover:text-primary hover:underline"
                        disabled={isLoading}
                      >
                        Ai uitat parola?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) validatePassword(e.target.value, mode === "login");
                    }}
                    onBlur={() => validatePassword(password, mode === "login")}
                    required
                    disabled={isLoading}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  {mode === "signup" && !errors.password && (
                    <p className="text-xs text-muted-foreground">
                      Min. 8 caractere, o literă mare, o literă mică și o cifră
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se procesează...
                    </>
                  ) : mode === "login" ? (
                    "Autentificare"
                  ) : (
                    "Înregistrare"
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setErrors({});
                  }}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  {mode === "login"
                    ? "Nu ai cont? Înregistrează-te"
                    : "Ai deja cont? Autentifică-te"}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
