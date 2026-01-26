import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Calendar, PieChart } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ReportData {
  title: string;
  report_data: any;
  created_at: string;
  expires_at: string | null;
}

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!token) {
        setError("Link invalid");
        setLoading(false);
        return;
      }

      try {
        // Fetch report by token (RLS policy allows anon access with valid token)
        const { data, error: fetchError } = await supabase
          .from("report_shares")
          .select("title, report_data, created_at, expires_at")
          .eq("share_token", token)
          .single();

        if (fetchError || !data) {
          setError("Raportul nu a fost găsit, a expirat sau a fost revocat");
          return;
        }

        // Check expiration (note: revoked check is handled by RLS policy)
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError("Acest link a expirat");
          return;
        }

        setReport(data);

        // Increment view count atomically using RPC function
        try {
          await supabase.rpc('increment_report_view_count', { token_param: token });
        } catch {
          // Ignore errors - view count is not critical
        }
      } catch (err) {
        setError("Nu s-a putut încărca raportul");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">{error}</h2>
              <p className="text-muted-foreground">
                Verifică link-ul sau contactează persoana care ți-a partajat raportul.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) return null;

  const reportData = report.report_data as any;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c43'];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-6 w-6 text-primary" />
              <CardTitle>{report.title}</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Generat pe {new Date(report.created_at).toLocaleDateString('ro-RO')}
              {report.expires_at && (
                <span className="text-muted-foreground">
                  • Expiră {new Date(report.expires_at).toLocaleDateString('ro-RO')}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            {reportData?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {reportData.summary.totalIncome !== undefined && (
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Venituri</p>
                    <p className="text-xl font-semibold text-green-600">
                      {Number(reportData.summary.totalIncome).toFixed(2)} RON
                    </p>
                  </div>
                )}
                {reportData.summary.totalExpenses !== undefined && (
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Cheltuieli</p>
                    <p className="text-xl font-semibold text-red-600">
                      {Number(reportData.summary.totalExpenses).toFixed(2)} RON
                    </p>
                  </div>
                )}
                {reportData.summary.balance !== undefined && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sold</p>
                    <p className="text-xl font-semibold">
                      {Number(reportData.summary.balance).toFixed(2)} RON
                    </p>
                  </div>
                )}
                {reportData.summary.transactionCount !== undefined && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Tranzacții</p>
                    <p className="text-xl font-semibold">{reportData.summary.transactionCount}</p>
                  </div>
                )}
              </div>
            )}

            {/* Category Chart */}
            {reportData?.categories && reportData.categories.length > 0 && (
              <div className="h-80">
                <h3 className="text-lg font-medium mb-4">Cheltuieli pe categorii</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={reportData.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.categories.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} RON`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Raw data fallback */}
            {!reportData?.summary && !reportData?.categories && (
              <div className="text-muted-foreground">
                <pre className="text-sm overflow-auto p-4 bg-muted rounded-lg">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Acest raport a fost partajat public. Datele sunt doar pentru vizualizare.
        </p>
      </div>
    </div>
  );
}
