
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lightbulb, CheckCircle2, AlertTriangle, Info, Settings, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { DiagnosticResults } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

function AnalysisContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'insights' | 'settings'>('insights');
  const [licenseInput, setLicenseInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);

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

  const handleActivateLicense = async () => {
    if (!licenseInput.trim()) return;
    
    setIsActivating(true);
    try {
        const response = await fetch('/api/license/activate', {
            method: 'POST',
            body: JSON.stringify({ licenseKey: licenseInput }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Save to Google Apps Script Properties
            // @ts-ignore
            google.script.run.saveUserLicense(licenseInput);
            
            toast({
                title: "License Activated",
                description: "Your key has been successfully linked to your account."
            });
            setView('insights');
            window.location.reload();
        } else {
            setError(result.message);
            toast({
                variant: 'destructive',
                title: "Activation Failed",
                description: result.message
            });
        }
    } catch (e) {
        toast({
            variant: 'destructive',
            title: "Network Error",
            description: "Could not reach the activation server."
        });
    } finally {
        setIsActivating(false);
    }
  };

  if (view === 'settings') {
    return (
      <div className="flex flex-col gap-6 p-4 bg-background min-h-screen">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setView('insights')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-brand text-lg font-bold">Settings</h2>
        </div>
        
        <Card className="shadow-none border-2">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              License Activation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-xs text-muted-foreground">
              Enter your Quinfer license key. Once activated, it will be locked to this account.
            </p>
            <Input 
              placeholder="XXXXXXXX-XXXXXXXX..." 
              value={licenseInput}
              onChange={(e) => setLicenseInput(e.target.value)}
              className="text-xs font-mono"
              disabled={isActivating}
            />
            <Button className="w-full text-xs" onClick={handleActivateLicense} disabled={isActivating}>
              {isActivating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Activate License
            </Button>
            <div className="pt-2">
              <p className="text-[10px] text-center text-muted-foreground">
                Don't have a key? <br/>
                <a href="https://quinfer.gumroad.com/l/quinfer-license" target="_blank" className="text-primary font-bold underline">Buy a License</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground font-medium">Scanning for gaps...</p>
      </div>
    );
  }

  if (error) {
    const isLicenseError = error.toLowerCase().includes('license') || error.toLowerCase().includes('403') || error.toLowerCase().includes('limit');
    return (
      <div className="p-6 text-center min-h-screen flex flex-col justify-center items-center bg-background">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-sm font-bold text-destructive mb-2">
          {isLicenseError ? "License Required" : "Analysis Error"}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6">{error}</p>
        {isLicenseError ? (
          <Button onClick={() => setView('settings')} variant="default" className="w-full">
            Activate License
          </Button>
        ) : (
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-6 text-center min-h-screen flex flex-col justify-center items-center bg-background relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 opacity-50" 
          onClick={() => setView('settings')}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <img src="/logo.svg" alt="Quinfer" className="h-12 mb-4" />
        <p className="text-sm font-medium">Waiting for Google Form Data...</p>
        <p className="text-xs text-muted-foreground mt-2">Please run the analysis from the Google Forms menu.</p>
      </div>
    );
  }

  const primaryIssue = results.primaryLearningIssues?.[0];

  return (
    <div className="flex flex-col gap-4 p-2 bg-background select-none pb-12 overflow-x-hidden relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 opacity-50 z-10" 
        onClick={() => setView('settings')}
      >
        <Settings className="h-4 w-4" />
      </Button>

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
