// src/services/leonardoAi.ts

const LEONARDO_API_KEY = process.env.NEXT_PUBLIC_LEONARDO_API_KEY;
const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';

// Leonardo Creative model
const CREATIVE_MODEL_ID = 'e316348f-7773-490e-adcd-46757c738eb7';

interface GenerationRequest {
  prompt: string;
  modelId?: string;
  negative_prompt?: string;
}

interface GenerationResponse {
  generationId: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
  imageUrls: string[];
}

export class LeonardoAiService {
  private apiKey: string;
  
  constructor(apiKey: string = LEONARDO_API_KEY || '') {
    this.apiKey = apiKey;
    if (!this.apiKey) {
      console.warn('Leonardo AI API key is not set');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    console.log('Making Leonardo AI request:', {
      endpoint,
      method: options.method,
      body: options.body ? JSON.parse(options.body as string) : null
    });

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Leonardo AI error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Leonardo AI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Leonardo AI response:', data);
    return data;
  }

  async generateImage(params: GenerationRequest): Promise<string> {
    try {
      // Start the generation with minimal parameters
      const generationResponse = await this.makeRequest('/generations', {
        method: 'POST',
        body: JSON.stringify({
          prompt: params.prompt,
          modelId: params.modelId || CREATIVE_MODEL_ID,
          negative_prompt: params.negative_prompt || '',
          num_images: 1,
          width: 768,
          height: 512
        }),
      });

      const generationId = generationResponse.sdGenerationJob.generationId;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 15; // 3 minutes maximum waiting time
      
      while (attempts < maxAttempts) {
        const status = await this.checkGenerationStatus(generationId);
        
        if (status.status === 'COMPLETE') {
          return status.imageUrls[0];
        }
        
        if (status.status === 'FAILED') {
          throw new Error('Image generation failed');
        }
        
        // Wait 12 seconds between checks
        await new Promise(resolve => setTimeout(resolve, 12000));
        attempts++;
      }

      throw new Error('Generation timed out');

    } catch (error) {
      console.error('Leonardo AI generation error:', error);
      throw error;
    }
  }

  async checkGenerationStatus(generationId: string): Promise<GenerationResponse> {
    const response = await this.makeRequest(`/generations/${generationId}`);
    
    return {
      generationId,
      status: response.generations_by_pk.status,
      imageUrls: response.generations_by_pk.generated_images.map(
        (img: any) => img.url
      ),
    };
  }
}

// Export a singleton instance
export const leonardoAi = new LeonardoAiService();