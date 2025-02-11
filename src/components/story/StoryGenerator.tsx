"use client"

// src/components/story/StoryGenerator.tsx
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StoryResponse {
  title?: string;
  characters?: string[];
  story?: string;
  endingNote?: string;
  error?: string;
  code?: string;
}

const StoryGenerator = () => {
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStory(null);

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
        let errorMessage = data.error;
        
        switch (data.code) {
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = "We're experiencing high demand. Please try again in a few moments.";
            break;
          case 'QUOTA_EXCEEDED':
            errorMessage = "We've reached our story limit for now. Please try again later.";
            break;
          case 'OPENAI_API_ERROR':
            errorMessage = "Oops! Our story machine needs a quick break. Please try again.";
            break;
          default:
            errorMessage = "Something went wrong. Please try again.";
        }
        
        setError(errorMessage);
        return;
      }

      setStory(data);
    } catch (err) {
      setError('Unable to connect to the story generator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>AI Story Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generateStory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="childName">Childs Name</Label>
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
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Story...' : 'Generate Story'}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {story && !error && (
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-bold">{story.title}</h2>
              
              {story.characters && story.characters.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Characters:</h3>
                  <ul className="list-disc pl-5">
                    {story.characters.map((character, index) => (
                      <li key={index}>{character}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {story.story && (
                <div>
                  <h3 className="font-semibold mb-2">Story:</h3>
                  <p className="whitespace-pre-wrap">{story.story}</p>
                </div>
              )}
              
              {story.endingNote && (
                <div>
                  <h3 className="font-semibold mb-2">Ending Note:</h3>
                  <p>{story.endingNote}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryGenerator;