// src/app/api/generate-story/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateCharacterDescription(childName: string, age: string, gender: string, imageData: string) {
  try {
    console.log('\n=== Image Analysis Request ===');
    const imageAnalysisPrompt = "Analyze this image and describe the person using these exact parameters. Only respond with parameter values, nothing else:\n\nHairstyle: (Choose from: Pixie Cut, Buzz Cut, Crew Cut, Bob Cut, Shag, Lob, Layered Cut, Undercut, French Bob, V-Cut, U-Cut, Feathered Cut, Curly Bob, Beach Waves, Afro, Ringlets, Spiral Curls, Classic Bun, Top Knot, Chignon, Braided Bun, Messy Bun, Classic Braid, French Braid, Dutch Braid, Fishtail Braid, Cornrows, High Ponytail, Low Ponytail, Side Ponytail, Braided Ponytail, Bubble Ponytail, Pompadour, Quiff, Slick Back, Side Part, Mohawk, Dreadlocks, Man Bun, Emo Cut, Mullet, Straight Across Bangs, Side-Swept Bangs, Curtain Bangs, Wispy Bangs, Blunt Bangs)\n\nHair Color: (Choose from: Black, Brown, Blonde, Auburn, Red, Gray, White, Silver, Platinum Blonde, Golden Blonde, Strawberry Blonde, Light Brown, Dark Brown, Chestnut, Burgundy, Blue, Green, Pink, Purple, Orange, Multicolored)\n\nSkin Tone: (Choose from: Fair, Light, Medium, Olive, Tan, Bronze, Dark, Deep, Alabaster, Porcelain, Ivory, Beige, Sand, Golden, Caramel, Honey, Chestnut, Espresso, Cocoa, Chocolate, Ebony, Almond, Warm Beige)\n\nAccessories: (e.g. Glasses, Headband etc.)\n\nOutfit Upper Body: (e.g., T-shirt, Blouse, Jacket)\n\nUpper Clothing Color: (e.g., Red, Blue, Green, Yellow, Pink, Purple, etc.)\n\nOutfit Lower Body: (e.g., Skirt, Pants, Shorts)\n\nLower Clothing Color: (e.g., Black, White, Brown, Gray, etc.)\n\nFacial Expression: (e.g., Cheerful, Serious, Thoughtful, Excited, Playful, etc.)\n\nAction: (e.g., Dancing, Playing, Smiling, Reading, Jumping, etc.)";

    const imageAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: imageAnalysisPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageData,
                detail: "low"
              }
            }
          ],
        },
      ],
      max_tokens: 300,
    });

    console.log('\n=== Image Analysis Response ===');
    console.log(imageAnalysisResponse.choices[0].message.content);

    const params = imageAnalysisResponse.choices[0].message.content?.split('\n').reduce((acc: any, line) => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) acc[key] = value;
      return acc;
    }, {});

    const characterDesc = `A ${params['Skin Tone']}-skinned character with ${params.Hairstyle} ${params['Hair Color']} hair, wearing ${params.Accessories || 'no accessories'}, dressed in a ${params['Upper Clothing Color']} ${params['Outfit Upper Body']} and ${params['Lower Clothing Color']} ${params['Outfit Lower Body']}, ${params['Facial Expression']} expression, shown ${params.Action}, Pixar 3D animation style, high quality, detailed`;

    console.log('\n=== Generated Character Description ===');
    console.log(characterDesc);

    return characterDesc;
  } catch (error) {
    console.error('\n=== Error Analyzing Image ===');
    console.error(error);
    throw error;
  }
}

function parseStoryResponse(response: string) {
  try {
    // Split into sections by "Page" markers
    const sections = response.split(/\*\*Page \d+\*\*/g).filter(Boolean);
    
    // Extract title from first section
    const titleMatch = sections[0].match(/Title: (.+?)(?:\r?\n|$)/);
    const storyTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Story';
    
    // Process each page section
    const pages = sections.slice(1).map((section, index) => {
      // Use regex to extract content and image prompt
      const contentMatch = section.match(/Content: ([\s\S]*?)(?=Image Prompt:|$)/i);
      const imagePromptMatch = section.match(/Image Prompt: ([\s\S]*?)(?=\*\*|$)/i);
      
      return {
        pageNumber: index + 1,
        content: contentMatch ? contentMatch[1].trim() : '',
        imagePrompt: imagePromptMatch ? imagePromptMatch[1].trim() : ''
      };
    });

    return { title: storyTitle, pages: pages.filter(page => page.content && page.imagePrompt) };
  } catch (error) {
    console.error('Error parsing story response:', error);
    throw new Error('Failed to parse story response');
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const childName = formData.get('childName') as string;
    const age = formData.get('age') as string;
    const gender = formData.get('gender') as string;
    const image = formData.get('image') as File;

    if (!childName || !age || !gender || !image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('\n=== Story Generation Request ===');
    console.log(`Name: ${childName}, Age: ${age}, Gender: ${gender}`);

    // Convert image to base64 using the working method from the first file
    const imageArrayBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');
    const imageData = `data:${image.type};base64,${imageBase64}`;

    // Generate character description from image
    const characterDesc = await generateCharacterDescription(childName, age, gender, imageData);

    const storyPrompt = `
Create a magical bedtime story for ${childName}, a ${age}-year-old ${gender}. The story should be 7-10 pages long, each page containing:
1. A short paragraph of story content (2-3 sentences)
2. A detailed image prompt describing the scene

Story Guidelines:
- Use age-appropriate language and themes
- Include magical elements and wonder
- Feature a talking animal companion
- Add sound effects for engagement
- Build to a gentle, satisfying conclusion
- Include positive messages about friendship, courage, or kindness

Format each page exactly as follows:
**Page 1**
Content: [2-3 sentences of story text]
Image Prompt: [Detailed scene description], featuring "${characterDesc}"

[Continue with remaining pages]`;

    console.log('\n=== Story Generation Prompt ===');
    console.log(storyPrompt);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a children's book author specializing in magical bedtime stories. Create engaging, age-appropriate content with vivid imagery suitable for AI illustration. For each scene's image prompt, first write a detailed description of the magical scene, environment, lighting, and atmosphere. Then add ', featuring' followed by the exact character description provided. Make each scene description vivid and detailed, suitable for AI image generation."
        },
        {
          role: "user",
          content: storyPrompt
        }
      ],
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    console.log('\n=== ChatGPT Response ===');
    console.log(response);

    const parsedStory = parseStoryResponse(response);

    console.log('\n=== Final Story Structure ===');
    console.log(JSON.stringify(parsedStory, null, 2));

    return NextResponse.json(parsedStory);

  } catch (error: any) {
    console.error('\n=== Error ===');
    console.error('Error details:', error);

    if (error.code === 'OPENAI_RATE_LIMIT_EXCEEDED') {
      return NextResponse.json(
        { error: 'Story generator is busy. Please try again in a moment.' },
        { status: 429 }
      );
    }

    if (error.code === 'OPENAI_INVALID_API_KEY') {
      return NextResponse.json(
        { error: 'Configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: error.status || 500 }
    );
  }
}