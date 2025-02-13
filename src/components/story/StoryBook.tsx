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
    <div className="relative max-w-4xl mx-auto mt-4">
      <div className="aspect-[3/2] relative rounded-lg shadow-lg overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {loading ? (
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          ) : (
            <img 
              src={currentPageData.imageUrl || `https://picsum.photos/800/533`}
              alt={`Scene ${currentPage + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://picsum.photos/800/533`;
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex justify-between items-center text-white/90">
            <span className="text-sm">Page {currentPage + 1} of {pages.length}</span>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>

          {/* Story Text */}
          <div className="flex-1 flex items-center justify-center px-6">
            {loading ? (
              <div className="w-full max-w-lg">
                <div className="h-4 bg-white/20 rounded mb-3 animate-pulse" />
                <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse" />
              </div>
            ) : (
              <p className="text-white text-lg text-center leading-relaxed drop-shadow-md max-w-lg">
                {currentPageData.content}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={isFirstPage || loading}
              className="bg-white/80 hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={isLastPage || loading}
              className="bg-white/80 hover:bg-white"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryBook;