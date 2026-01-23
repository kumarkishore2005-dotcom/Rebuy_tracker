'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, initiateAnonymousSignIn } from '@/firebase';
import { collection, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, LogIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table } from '@/lib/types';
import { RoleSelector } from '@/components/auth/role-selector';

function CreateTableForm({ onCreate }: { onCreate: (name: string) => void }) {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (trimmedName) {
            onCreate(trimmedName);
            setName('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                placeholder="New Table Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <Button type="submit" disabled={!name.trim()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create
            </Button>
        </form>
    );
}

function TableList({ tables, isLoading }: { tables: Table[] | null, isLoading: boolean }) {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                ))}
            </div>
        );
    }
    
    if (!tables || tables.length === 0) {
        return <p className="text-center text-primary-foreground/60 py-4">No active tables. Create one to get started!</p>;
    }

    return (
        <div className="space-y-4">
            {tables.map(table => (
                <Card key={table.id} className="bg-card/90">
                    <CardHeader>
                        <CardTitle>{table.name}</CardTitle>
                        <CardDescription>
                            Created on: {table.createdAt.toDate().toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedTableId === table.id ? (
                            <RoleSelector tableId={table.id} />
                        ) : (
                            <Button className="w-full" onClick={() => setSelectedTableId(table.id)}>
                                <LogIn className="mr-2 h-4 w-4" /> Join Table
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


export default function HomePage() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const bgImage = PlaceHolderImages.find((img) => img.id === 'login-bg');
  const didInitAuth = useRef(false);

  useEffect(() => {
    if (didInitAuth.current) return;
    if (auth && firestore && !user && !isUserLoading) {
      didInitAuth.current = true;
      initiateAnonymousSignIn(auth);
    }
  }, [auth, firestore, user, isUserLoading]);

  const tablesColRef = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'tables'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: tables, isLoading: isTablesLoading } = useCollection<Table>(tablesColRef);

  const handleCreateTable = async (name: string) => {
    if (!firestore || !tablesColRef) return;
    try {
        const tablesCollection = collection(firestore, 'tables');
        await addDoc(tablesCollection, {
            name,
            createdAt: Timestamp.now(),
        });
        toast({
            title: "Table Created",
            description: `The table "${name}" has been successfully created.`,
        });
    } catch (e) {
        console.error("Error creating table: ", e);
        toast({
            title: "Error",
            description: "Could not create the table. Please try again.",
            variant: "destructive",
        });
    }
  };
  
  if (isUserLoading) {
    return (
         <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
             <div className="text-center text-primary-foreground">
                 <h1 className="text-2xl font-bold">Connecting...</h1>
                 <p>Initializing your session...</p>
             </div>
         </main>
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          priority
          className="object-cover -z-10 brightness-[.25]"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-headline text-primary-foreground">Rebuy Tracker</h1>
            <p className="text-accent">Join a table or create a new one.</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-white/20">
            <CardHeader>
                <CardTitle>Create New Table</CardTitle>
            </CardHeader>
            <CardContent>
                <CreateTableForm onCreate={handleCreateTable} />
            </CardContent>
        </Card>
        
        <div className="space-y-4">
            <h2 className="text-2xl font-headline text-center text-primary-foreground">Active Tables</h2>
            <TableList tables={tables} isLoading={isTablesLoading} />
        </div>

      </div>
    </main>
  );
}
