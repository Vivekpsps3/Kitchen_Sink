'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Featured2Page() {
  const router = useRouter();

  useEffect(() => {
    router.push('/r?id=21');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="font-matina">Redirecting to Lion's Mane and Tomato on Toast recipe...</p>
    </div>
  );
} 