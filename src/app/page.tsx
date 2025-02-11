// src/app/page.tsx
import StoryGenerator from '@/components/story/StoryGenerator';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <StoryGenerator />
    </main>
  );
}