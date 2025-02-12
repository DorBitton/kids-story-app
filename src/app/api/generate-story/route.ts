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

    // Create a consistent character description for image generation
    const leonardoCharacterDesc = `A ${params['Skin Tone']}-skinned character with ${params.Hairstyle} ${params['Hair Color']} hair, wearing ${params.Accessories || 'no accessories'}, dressed in a ${params['Upper Clothing Color']} ${params['Outfit Upper Body']} and ${params['Lower Clothing Color']} ${params['Outfit Lower Body']}, ${params['Facial Expression']} expression, shown ${params.Action}, Pixar 3D animation style, high quality, detailed`;

    console.log('\n=== Generated Character Description ===');
    console.log(leonardoCharacterDesc);

    return leonardoCharacterDesc;
  } catch (error: any) {
    console.error('\n=== Error Analyzing Image ===');
    console.error(error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const childName = formData.get('childName') as string;
    const age = formData.get('age') as string;
    const gender = formData.get('gender') as string;
    const image = formData.get('image') as File;

    console.log('\n=== Story Generation Request ===');
    console.log(`Name: ${childName}, Age: ${age}, Gender: ${gender}`);

    const imageArrayBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');
    const imageData = `data:${image.type};base64,${imageBase64}`;

    const characterDesc = await generateCharacterDescription(childName, age, gender, imageData);

    const prompt = `Create a magical bedtime story for a ${age} year old ${gender} named ${childName}. The story should be divided into 5 pages, with each page containing a short scene.

Requirements for each page:
- 2-3 sentences of story content
- An image generation prompt that MUST include this exact character description in EVERY scene: "${characterDesc}"
- Simple ${age}-appropriate language
- Each scene should show the character in different magical settings and situations
- Include whimsical elements and positive themes

Format the response exactly as follows:
Title: [Story Title]

Page 1:
Content: [2-3 sentences of story]
Image Prompt: [Write a detailed scene description first, then add ", featuring" and then add this exact character description: ${characterDesc}]

Example format for Image Prompt:
"A magical bedroom at dawn with soft golden sunlight streaming through a window, twinkling stars fading away, magical sparkles in the air, dream-like atmosphere, soft pastel colors, featuring [character description]"

[Repeat for pages 2-5]`;

    console.log('\n=== Story Generation Prompt ===');
    console.log(prompt);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a children's book author and illustrator who creates engaging, age-appropriate stories with vivid scene descriptions. For each scene's image prompt, first write a detailed description of the magical scene, environment, lighting, and atmosphere. Then add ', featuring' followed by the exact character description provided. Make each scene description vivid and detailed, suitable for AI image generation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices[0].message.content;
    console.log('\n=== ChatGPT Response ===');
    console.log(response);

    const [title, ...pageTexts] = response!.split('\n\n').filter(text => text.trim());
    const storyTitle = title.replace('Title: ', '').trim();
    
    const pages = pageTexts.map((pageText, index) => {
      const [pageHeader, content, imagePrompt] = pageText.split('\n');
      return {
        pageNumber: index + 1,
        content: content.replace('Content: ', '').trim(),
        imagePrompt: imagePrompt?.replace('Image Prompt: ', '').trim()
      };
    });

    console.log('\n=== Final Story Structure ===');
    console.log(JSON.stringify({ title: storyTitle, pages }, null, 2));

    return NextResponse.json({
      title: storyTitle,
      pages: pages
    });

  } catch (error: any) {
    console.error('\n=== Error ===');
    console.error('Error details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate story. Please try again.' },
      { status: error.status || 500 }
    );
  }
}