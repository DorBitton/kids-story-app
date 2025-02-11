// src/services/imageGeneration.ts
import { leonardoAi } from './leonardoAi';

const DEFAULT_NEGATIVE_PROMPT = 'ugly, blurry, low quality, distorted, disfigured, text, watermark';

interface GenerateImageResponse {
  imageUrl: string;
  status: 'complete' | 'pending' | 'failed';
  id: string;
}

export async function generateImage(prompt: string): Promise<GenerateImageResponse> {
  console.log('\n=== Image Generation Request ===');
  console.log('Original Prompt:', prompt);

  try {
    // Enhance the prompt
    const enhancedPrompt = `simple children's illustration, ${prompt}, basic colors, simple shapes`;
    console.log('Enhanced Prompt:', enhancedPrompt);
    
    console.log('Calling Leonardo AI...');
    const imageUrl = await leonardoAi.generateImage({
      prompt: enhancedPrompt,
      negative_prompt: DEFAULT_NEGATIVE_PROMPT,
    });

    console.log('Image Generated Successfully:', imageUrl);

    return {
      imageUrl,
      status: 'complete',
      id: Math.random().toString(36).substring(7)
    };
  } catch (error) {
    console.error('\n=== Image Generation Error ===');
    console.error('Error details:', error);
    
    const fallbackUrl = `https://picsum.photos/768/512?random=${Math.random()}`;
    console.log('Using fallback image:', fallbackUrl);
    
    return {
      imageUrl: fallbackUrl,
      status: 'failed',
      id: Math.random().toString(36).substring(7)
    };
  }
}