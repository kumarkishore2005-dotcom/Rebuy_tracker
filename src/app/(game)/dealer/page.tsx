
'use client';
import { useState, useEffect } from 'react';
import { DealerView } from '@/components/dashboard/dealer-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const DEALER_PASSWORD = 'test1234';

function DealerPageContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check session storage to persist authentication during the session
    const sessionAuth = sessionStorage.getItem('dealerAuthenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEALER_PASSWORD) {
      setError('');
      sessionStorage.setItem('dealerAuthenticated', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dealer Access</CardTitle>
            <CardDescription>
              Please enter the password to access the dealer dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DealerView />;
}

export default function DealerPage() {
    return <DealerPageContent />;
}
