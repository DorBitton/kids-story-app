"use client"

import { useState, useRef } from 'react';
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
  const [gender, setGender] = useState('male');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('Please upload a character image');
      return;
    }

    setLoading(true);
    setError(null);
    setStory(null);
    setCurrentPage(0);

    try {
      const formData = new FormData();
      formData.append('childName', childName);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('image', image);

      const response = await fetch('/api/generate-story', {
        method: 'POST',
        body: formData,
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
              imageUrl: `https://picsum.photos/768/512?random=${Math.random()}`,
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
              <Label htmlFor="childName">Child's Name</Label>
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

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Character Image</Label>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-md"
                  />
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || generatingImages || !image}
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