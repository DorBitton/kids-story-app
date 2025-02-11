// src/app/api/generate-story/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { childName, age } = await request.json();

    // Construct the prompt
    const prompt = `I need to write a short bedtime story that is engaging, imaginative, and comforting for a ${age} year old child named ${childName}. The story should:
    - Be 250-300 characters long and concise
    - Use simple grade 10 English
    - Have a clear beginning, middle, and happy ending
    - Include positive themes like friendship, kindness, or bravery
    - Feature magical or whimsical elements
    - Include two main characters with brief descriptions
    - Use rhythm or repetitive phrases
    - End on a soothing note
    
    Please format the response as follows:
    Title:
    Characters:
    - Character 1 description
    - Character 2 description
    Story:
    [Story content]
    Ending Note:
    [Comforting closing message]`;

    try {
      // Call ChatGPT API with error handling
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a skilled children's story writer who creates engaging, age-appropriate bedtime stories."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 500
      });

      // Parse the response
      const storyResponse = completion.choices[0].message.content;

      // Split the response into sections
      const sections = storyResponse.split('\n\n');
      const storyObject = {
        title: '',
        characters: [],
        story: '',
        endingNote: ''
      };

      // Parse each section
      sections.forEach(section => {
        if (section.startsWith('Title:')) {
          storyObject.title = section.replace('Title:', '').trim();
        } else if (section.startsWith('Characters:')) {
          storyObject.characters = section
            .replace('Characters:', '')
            .trim()
            .split('\n')
            .map(char => char.trim())
            .filter(char => char.startsWith('-'))
            .map(char => char.substring(1).trim());
        } else if (section.startsWith('Story:')) {
          storyObject.story = section.replace('Story:', '').trim();
        } else if (section.startsWith('Ending Note:')) {
          storyObject.endingNote = section.replace('Ending Note:', '').trim();
        }
      });

      return NextResponse.json(storyObject);

    } catch (openAiError: any) {
      // Handle specific OpenAI API errors
      if (openAiError.status === 429) {
        return NextResponse.json(
          { 
            error: 'API rate limit exceeded. Please try again in a few moments.',
            code: 'RATE_LIMIT_EXCEEDED'
          },
          { status: 429 }
        );
      }
      
      if (openAiError.status === 402) {
        return NextResponse.json(
          { 
            error: 'API quota exceeded. Please check your OpenAI account.',
            code: 'QUOTA_EXCEEDED'
          },
          { status: 402 }
        );
      }

      // Log the specific error for debugging
      console.error('OpenAI API Error:', {
        status: openAiError.status,
        message: openAiError.message,
        type: openAiError.type
      });

      return NextResponse.json(
        { 
          error: 'An error occurred while generating the story. Please try again.',
          code: 'OPENAI_API_ERROR'
        },
        { status: openAiError.status || 500 }
      );
    }

  } catch (error) {
    console.error('General error generating story:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process your request. Please try again.',
        code: 'GENERAL_ERROR'
      },
      { status: 500 }
    );
  }
}