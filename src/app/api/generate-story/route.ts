// src/app/api/generate-story/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { childName, age } = await request.json();

    console.log('\n=== Story Generation Request ===');
    console.log(`Generating story for ${childName}, age ${age}`);

    const prompt = `Create a bedtime story for a ${age} year old child named ${childName}. The story should be divided into 5 pages, with each page containing a short scene and a detailed scene description for image generation.

Requirements:
- Each page should have 2-3 sentences of story content
- Include a specific image generation prompt for each page that captures the scene
- Use simple grade ${age}-appropriate language
- Include magical or whimsical elements
- Feature positive themes like friendship, kindness, or bravery

Format the response exactly as follows:
Title: [Story Title]

Page 1:
Content: [2-3 sentences of story]
Image Prompt: [Detailed scene description for AI image generation]

[Repeat for all pages]

Make the image prompts detailed and specific, including style suggestions like "digital art style", "watercolor illustration", or "3D rendered scene".`;

    console.log('\n=== Prompt Sent to ChatGPT ===');
    console.log(prompt);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a children's book author and illustrator who creates engaging, age-appropriate stories with vivid scene descriptions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;

    console.log('\n=== ChatGPT Response ===');
    console.log(response);

    // Parse the response into pages
    const [title, ...pageTexts] = response.split('\n\n').filter(text => text.trim());
    const storyTitle = title.replace('Title: ', '').trim();
    
    const pages = pageTexts.map((pageText, index) => {
      const [pageHeader, content, imagePrompt] = pageText.split('\n');
      return {
        pageNumber: index + 1,
        content: content.replace('Content: ', '').trim(),
        imagePrompt: imagePrompt.replace('Image Prompt: ', '').trim()
      };
    });

    console.log('\n=== Parsed Story Structure ===');
    console.log(JSON.stringify({ title: storyTitle, pages }, null, 2));

    return NextResponse.json({
      title: storyTitle,
      pages: pages
    });

  } catch (error: any) {
    console.error('\n=== Error Generating Story ===');
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: 500 }
    );
  }
}