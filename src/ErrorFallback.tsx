import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Shield } from "@phosphor-icons/react";
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;

  const isNetworkError = error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ECONNREFUSED');
  const isAuthError = error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('authentication');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--destructive)_0%,_transparent_45%)] opacity-10" aria-hidden="true" />
      
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-center mb-6">
          <Shield weight="duotone" size={48} className="text-primary opacity-50" />
        </div>

        <Card className="border-destructive/20">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="text-destructive mt-0.5" size={20} />
              <div>
                <CardTitle className="text-lg">Application Error</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isNetworkError && "We're having trouble connecting to our services."}
                  {isAuthError && "Your session may have expired or you need to sign in again."}
                  {!isNetworkError && !isAuthError && "Something unexpected happened while running the Healthcare Assistant."}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {import.meta.env.DEV && (
              <Alert variant="destructive">
                <AlertTitle className="text-sm">Error Details (Development Mode):</AlertTitle>
                <AlertDescription>
                  <pre className="text-xs mt-2 bg-destructive/10 p-3 rounded border overflow-auto max-h-32 whitespace-pre-wrap break-words">
                    {error.message}
                  </pre>
                  {error.stack && (
                    <pre className="text-xs mt-2 bg-destructive/10 p-3 rounded border overflow-auto max-h-48 whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="bg-muted/50 border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">What you can do:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {isNetworkError && (
                  <>
                    <li>Check your internet connection</li>
                    <li>Verify that the NPHIES service is operational</li>
                    <li>Try again in a few moments</li>
                  </>
                )}
                {isAuthError && (
                  <>
                    <li>Sign in again with your credentials</li>
                    <li>Clear your browser cache and cookies</li>
                    <li>Contact support if the issue persists</li>
                  </>
                )}
                {!isNetworkError && !isAuthError && (
                  <>
                    <li>Click "Try Again" to reload the application</li>
                    <li>If the problem persists, contact technical support</li>
                    <li>Report this issue with the error details</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={resetErrorBoundary} 
                className="flex-1"
                variant="default"
              >
                <RefreshCwIcon size={16} className="mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                className="flex-1"
                variant="outline"
              >
                <HomeIcon size={16} className="mr-2" />
                Go Home
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              For immediate assistance, contact our support team
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
