import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { apiService } from '@/services/api';

export function HealthWarning() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await apiService.healthCheck();
        if (!mounted) return;
        setIsOnline(true);
        setMessage('');
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : 'Backend is unreachable.';
        setIsOnline(false);
        setMessage(msg);
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (isOnline !== false) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>API Unreachable</AlertTitle>
      <AlertDescription>
        {message || 'Unable to connect to the API server. Please verify that your backend is running and accessible.'}
      </AlertDescription>
    </Alert>
  );
}
