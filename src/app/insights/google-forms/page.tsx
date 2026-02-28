
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Info, Lightbulb, BookOpen, Clipboard, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { DiagnosticResults } from '@/lib/definitions';

/**
 * Sidebar View for Google Forms Add-on
 * This page is designed to be loaded within the Google Forms Sidebar (approx 300px width).
 */
function AnalysisContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real add-on, the Apps Script would post data here or pass an ID
    // For this prototype, we assume the data is fetched based on a session ID
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
      setError("Please run the analysis from your Google Form.");
      setLoading(false);
      return;
    }

    // Simulation of fetching analysis from the cloud API
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Quinfer is scanning for gaps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-2 bg-background select-none pb-8">
      <div className="text-center py-2">
        <img src="/logo.svg" alt="Quinfer" className="h-8 mx-auto mb-1" />
        <h1 className="font-brand text-xl text-primary leading-tight">Insight Generator</h1>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Instructional Move</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-lg font-bold leading-tight mb-2">Reteach Foundations</p>
          <p className="text-xs text-muted-foreground">Students are consistently confusing Area with Perimeter. A conceptual reset is needed.</p>
        </CardContent>
      </Card>

      <div className="space-y-4 px-1">
        <section>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Primary Gap</h3>
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 border border-orange-200 dark:border-orange-900">
            <p className="text-sm font-semibold mb-1">Scale Misconception</p>
            <p className="text-xs leading-relaxed">Students are treating unit conversion as a simple decimal shift without reasoning about magnitude.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Tomorrow's Focus</h3>
          <ul className="space-y-2">
            <li className="flex gap-2 items-start text-xs">
              <Lightbulb className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
              <span>Use the <strong>Peach Analogy</strong> to explain layers.</span>
            </li>
            <li className="flex gap-2 items-start text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
              <span>Differentiate: Group 3 needs guided practice.</span>
            </li>
          </ul>
        </section>

        <Separator />

        <section>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Quick Wins</h3>
          <p className="text-xs leading-relaxed italic text-muted-foreground">"Ask students to draw the relationship before calculating to visualize the scale."</p>
        </section>
      </div>
    </div>
  );
}

export default function GoogleFormsInsightsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AnalysisContent />
    </Suspense>
  );
}
