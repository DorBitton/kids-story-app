import React from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryPage {
  pageNumber: number;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
  imageStatus?: 'pending' | 'complete' | 'failed';
}

interface StoryBookProps {
  title: string;
  pages: StoryPage[];
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
  loading?: boolean;
}

const StoryBook = ({ title, pages, currentPage, onPageChange, loading }: StoryBookProps) => {
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === pages.length - 1;
  const currentPageData = pages[currentPage];

  return (
    <div className="relative max-w-4xl mx-auto mt-8">
      <div className="aspect-[3/2] relative rounded-lg shadow-2xl overflow-hidden">
        {/* Background Image with loading state */}
        <div className="absolute inset-0">
          {loading ? (
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          ) : (
// Update the image source line in StoryBook.tsx
        <img 
         src={currentPageData.imageUrl || `https://picsum.photos/800/533`}
         alt={`Scene ${currentPage + 1}`}
         className="w-full h-full object-cover transition-opacity duration-500"
         onError={(e) => {
            e.currentTarget.src = `https://picsum.photos/800/533`;
        }}
        />
          )}
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Story Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          {/* Page number and title */}
          <div className="flex justify-between items-center text-white/80">
            <span className="text-sm">
              Page {currentPage + 1} of {pages.length}
            </span>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>

          {/* Story text */}
          <div className="flex-1 flex items-center justify-center px-8">
            {loading ? (
              <div className="w-full max-w-2xl">
                <div className="h-6 bg-white/20 rounded mb-4 animate-pulse" />
                <div className="h-6 bg-white/20 rounded mb-4 animate-pulse w-3/4" />
                <div className="h-6 bg-white/20 rounded animate-pulse w-1/2" />
              </div>
            ) : (
              <p className="text-white text-xl font-medium text-center leading-relaxed 
                           drop-shadow-lg max-w-2xl">
                {currentPageData.content}
              </p>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={isFirstPage || loading}
              className="bg-white/90 hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={isLastPage || loading}
              className="bg-white/90 hover:bg-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryBook;