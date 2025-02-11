"use client"

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StoryBook from './StoryBook';
import { generateImage } from '@/services/imageGeneration';

interface StoryPage {
  pageNumber: number;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
  imageStatus?: 'pending' | 'complete' | 'failed';
}

interface StoryResponse {
  title: string;
  pages: StoryPage[];
  error?: string;
}

const StoryGenerator = () => {
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);

  const generateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStory(null);
    setCurrentPage(0);

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ childName, age }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate story');
        return;
      }

      // Initialize story without images
      setStory(data);
      
      // Generate images for each page
      setGeneratingImages(true);
      const updatedPages = await Promise.all(
        data.pages.map(async (page: StoryPage) => {
          try {
            const imageResult = await generateImage(page.imagePrompt);
            return {
              ...page,
              imageUrl: imageResult.imageUrl,
              imageStatus: imageResult.status
            };
          } catch (err) {
            console.error('Failed to generate image for page:', page.pageNumber, err);
            return {
              ...page,
              imageUrl: `https://picsum.photos/800/533?random=${Math.random()}`,
              imageStatus: 'failed'
            };
          }
        })
      );

      setStory(prevStory => prevStory ? {
        ...prevStory,
        pages: updatedPages
      } : null);

    } catch (err) {
      setError('Unable to connect to the story generator. Please try again.');
    } finally {
      setLoading(false);
      setGeneratingImages(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>AI Story Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generateStory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="childName">Child Name</Label>
              <Input
                id="childName"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
                placeholder="Enter child's name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min="1"
                max="12"
                placeholder="Enter age"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || generatingImages}
              className="w-full"
            >
              {loading ? 'Creating Story...' : 
               generatingImages ? 'Generating Images...' : 
               'Generate Story'}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {story && !error && (
        <StoryBook
          title={story.title}
          pages={story.pages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          loading={loading || generatingImages}
        />
      )}
    </div>
  );
};

export default StoryGenerator;