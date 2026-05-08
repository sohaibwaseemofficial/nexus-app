'use client';

import { useEffect, useState } from 'react';
import { seedIfEmpty } from '../lib/seedData';

export default function Home() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Nexus</h1>
      <p className="text-gray-600 text-lg">
        {seeded ? 'Database ready ✅' : 'Setting up your environment...'}
      </p>
    </main>
  );
}