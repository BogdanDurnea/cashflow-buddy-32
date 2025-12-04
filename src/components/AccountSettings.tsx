import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Lock, KeyRound, Loader2, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

export function AccountSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Te rog completează toate câmpurile");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Parola trebuie să aibă minim 6 caractere");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Parolele nu coincid");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Parola a fost schimbată cu succes!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Eroare la schimbarea parolei");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error("Nu s-a putut determina email-ul contului");
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("Email de recuperare trimis! Verifică-ți inbox-ul.");
    } catch (error: any) {
      toast.error(error.message || "Eroare la trimiterea email-ului de recuperare");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // Note: Account deletion typically requires an edge function with service role
      // For now, we'll sign out and show a message to contact support
      await supabase.auth.signOut();
      toast.info("Pentru ștergerea completă a contului, te rugăm să contactezi suportul.");
    } catch (error: any) {
      toast.error(error.message || "Eroare la procesarea cererii");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <CardTitle>Contul Meu</CardTitle>
        </div>
        <CardDescription>
          Gestionează informațiile contului și securitatea
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Informații Cont</Label>
          </div>
          <div className="pl-6 space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email || "N/A"}</p>
              </div>
              <Shield className="h-4 w-4 text-success" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">ID Utilizator</p>
                <p className="text-xs text-muted-foreground font-mono">{user?.id?.slice(0, 8)}...</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Change Password */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Schimbă Parola</Label>
          </div>
          <div className="pl-6 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm">Parolă Nouă</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minim 6 caractere"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm">Confirmă Parola</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetă parola nouă"
              />
            </div>
            <Button 
              onClick={handlePasswordChange} 
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se procesează...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Schimbă Parola
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Password Recovery */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Recuperare Parolă</Label>
          </div>
          <div className="pl-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              Dacă ai uitat parola sau vrei să o resetezi, trimite un email de recuperare.
            </p>
            <Button 
              variant="outline" 
              onClick={handlePasswordReset}
              disabled={isSendingReset}
              className="w-full"
            >
              {isSendingReset ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Trimite Email de Recuperare
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Delete Account */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <Label className="text-sm font-medium text-destructive">Zona Periculoasă</Label>
          </div>
          <div className="pl-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              Ștergerea contului este permanentă și nu poate fi anulată.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Șterge Contul
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Această acțiune nu poate fi anulată. Toate datele tale vor fi șterse permanent,
                    inclusiv tranzacțiile, bugetele și setările.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Se procesează...
                      </>
                    ) : (
                      "Da, șterge contul"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
