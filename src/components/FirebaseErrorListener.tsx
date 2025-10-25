'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

// A mapping from operation types to user-friendly descriptions.
const OPERATION_DESCRIPTIONS: Record<string, string> = {
  get: 'Reading a specific document',
  list: 'Listing documents in a collection',
  create: 'Creating a new document',
  update: 'Updating an existing document',
  delete: 'Deleting a document',
  write: 'Writing data (create/update)',
};

export function FirebaseErrorListener() {
  const { toast } = useToast();
  const [error, setError] = React.useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
        // Only show errors in development to avoid exposing internal structure in production.
        if (process.env.NODE_ENV === 'development') {
            console.error(
                "Firestore Permission Error Caught:",
                e.getDebugMessage(),
                e.getContext()
            );
            setError(e);
        } else {
             // In production, show a generic toast.
            toast({
                variant: "destructive",
                title: "Permission Denied",
                description: "You don't have permission to perform this action.",
            });
        }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  const handleClose = () => {
    setError(null);
  };
  
  if (!error) {
    return null;
  }

  const { path, operation, auth, requestResourceData } = error.getContext();
  const operationDescription = OPERATION_DESCRIPTIONS[operation] || operation;

  return (
    <AlertDialog open={!!error} onOpenChange={(open) => !open && handleClose()}>
        <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    Firestore Security Rule Denied
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Your request to Firestore was blocked. Review the details below to fix your `firestore.rules`.
                </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 text-sm bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center">
                    <strong className="w-32">Operation:</strong> 
                    <Badge variant="outline">{operationDescription}</Badge>
                    <Badge variant="destructive" className="ml-2">{operation.toUpperCase()}</Badge>
                </div>
                <div className="flex items-start">
                    <strong className="w-32 mt-1">Path:</strong>
                    <code className="flex-1 font-mono text-xs bg-background p-2 rounded">{path}</code>
                </div>
                <div className="flex items-start">
                    <strong className="w-32 mt-1">Authenticated As:</strong>
                    <code className="flex-1 font-mono text-xs bg-background p-2 rounded">
                       {auth ? `UID: ${auth.uid}` : 'Not Authenticated'}
                    </code>
                </div>
            </div>

            {requestResourceData && (
                <div>
                    <h3 className="font-semibold mb-2">Request Data:</h3>
                    <ScrollArea className="h-48 w-full bg-background rounded-md border">
                        <pre className="p-4 text-xs font-mono">
                            {JSON.stringify(requestResourceData, null, 2)}
                        </pre>
                    </ScrollArea>
                </div>
            )}

            <AlertDialogFooter>
                <AlertDialogAction onClick={handleClose}>
                    Got it
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
