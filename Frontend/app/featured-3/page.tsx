'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Featured3Page() {
  const router = useRouter();

  useEffect(() => {
    router.push('/r?id=22');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="font-matina">Redirecting to Garden-to-Table Pesto Farfalle recipe...</p>
    </div>
  );
} 