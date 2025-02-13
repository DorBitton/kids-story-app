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

      setStory(data);
      
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
              imageUrl: `/api/placeholder/768/512?random=${Math.random()}`,
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
    <div className="min-h-screen bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center py-8">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
        {/* Input Form Section */}
        <div className="lg:w-1/3">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-purple-800">
                Create Your Story
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={generateStory} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="childName" className="text-lg font-semibold text-purple-700">
                    Child's Name
                  </Label>
                  <Input
                    id="childName"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    required
                    placeholder="Enter child's name"
                    className="border-2 border-purple-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-lg font-semibold text-purple-700">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min="1"
                    max="12"
                    placeholder="Enter age"
                    className="border-2 border-purple-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-lg font-semibold text-purple-700">
                    Gender
                  </Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-md border-2 border-purple-200 bg-white px-3 py-2"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image" className="text-lg font-semibold text-purple-700">
                    Character Image
                  </Label>
                  <div className="flex flex-col items-center space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-purple-200 hover:bg-purple-50"
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
                      <div className="relative w-32 h-32">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || generatingImages || !image}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-6"
                >
                  {loading ? 'Creating Story...' : 
                   generatingImages ? 'Generating Images...' : 
                   'Generate Story'}
                </Button>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-6">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Story Display Section */}
        <div className="lg:w-2/3">
          {story && !error && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl">
              <StoryBook
                title={story.title}
                pages={story.pages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                loading={loading || generatingImages}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryGenerator;