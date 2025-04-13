'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Featured1Page() {
  const router = useRouter();

  useEffect(() => {
    router.push('/r?id=20');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="font-matina">Redirecting to Vegetarian Buddha Bowl recipe...</p>
    </div>
  );
} 