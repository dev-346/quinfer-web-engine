
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Lightbulb, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import type { DiagnosticResults } from '@/lib/definitions';

function AnalysisContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rawData = searchParams.get('data');
    if (!rawData) {
      setLoading(false);
      return;
    }

    try {
      const decoded = JSON.parse(atob(rawData));
      if (decoded.success === false) {
        setError(decoded.message || "Analysis failed.");
      } else {
        setResults(decoded.results || decoded);
      }
    } catch (e) {
      console.error("Data parse error:", e);
      setError("Failed to load analysis data.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground font-medium">Scanning for gaps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center min-h-screen flex flex-col justify-center items-center bg-background">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-sm font-bold text-destructive mb-2">Analysis Error</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-6 text-center min-h-screen flex flex-col justify-center items-center bg-background">
        <img src="/logo.svg" alt="Quinfer" className="h-12 mb-4" />
        <p className="text-sm font-medium">Waiting for Google Form Data...</p>
        <p className="text-xs text-muted-foreground mt-2">Please run the analysis from the Google Forms menu.</p>
      </div>
    );
  }

  const primaryIssue = results.primaryLearningIssues?.[0];

  return (
    <div className="flex flex-col gap-4 p-2 bg-background select-none pb-12 overflow-x-hidden">
      <div className="text-center py-4">
        <img src="/logo.svg" alt="Quinfer" className="h-8 mx-auto mb-1" />
        <h1 className="font-brand text-xl text-primary leading-tight">Insight Generator</h1>
      </div>

      <Card className="border-2 border-primary/20 shadow-none">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Instructional Move</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-lg font-bold leading-tight mb-2">
            {results.teachingDecisionStatus?.status || 'Review Recommended'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {results.instructionalFocus?.details || 'Differentiated support is recommended based on student error patterns.'}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-5 px-1">
        {primaryIssue && (
          <section>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Primary Gap</h3>
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 border border-orange-200 dark:border-orange-900">
              <p className="text-sm font-bold mb-1">{primaryIssue.type}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{primaryIssue.details}</p>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Teaching Strategy</h3>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-900">
            <div className="flex gap-2 items-start text-xs">
              <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{results.teachingMove || 'Review concepts using a different visual representation.'}</span>
            </div>
          </div>
        </section>

        <Separator className="opacity-50" />

        <section>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Quick Wins</h3>
          <div className="space-y-3">
            {results.instructionalFocus?.level && (
              <div className="flex gap-2 items-start text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Target Level: <strong>{results.instructionalFocus.level}</strong></span>
              </div>
            )}
            <div className="flex gap-2 items-start text-xs italic text-muted-foreground px-1 leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
              <span>"Focus on identifying the 'Why' before the 'How' in tomorrow's opening activity."</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function GoogleFormsInsightsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AnalysisContent />
    </Suspense>
  );
}
