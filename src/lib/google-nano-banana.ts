import { GoogleGenAI } from "@google/genai";

export interface ImageGenerationResult {
  success: boolean;
  imageData?: string; // base64 encoded image
  error?: string;
}

export class GoogleNanoBananaService {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GOOGLE_NANO_BANANA_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_NANO_BANANA_API_KEY environment variable is required');
    }
    this.client = new GoogleGenAI({
      apiKey: apiKey
    });
  }

  /**
   * Generate an image for a menu item using Google Nano Banana API
   */
  async generateMenuItemImage(
    itemName: string,
    description?: string,
    cuisine?: string,
    retries: number = 2
  ): Promise<ImageGenerationResult> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create a controlled prompt for food image generation
        const prompt = this.createFoodPrompt(itemName, description, cuisine);
        
        console.log(`Generating image (attempt ${attempt + 1}/${retries + 1}) with prompt:`, prompt);

        const response = await this.client.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: prompt,
        });

        // Extract image data from response
        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              console.log('Image generated successfully');
              return {
                success: true,
                imageData: part.inlineData.data
              };
            }
          }
        }

        // If no image data found, try again unless it's the last attempt
        if (attempt < retries) {
          console.log('No image data found, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }

        return {
          success: false,
          error: 'No image data found in response after all attempts'
        };

      } catch (error) {
        console.error(`Google Nano Banana API error (attempt ${attempt + 1}):`, error);
        
        // If it's the last attempt, return the error
        if (attempt === retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    return {
      success: false,
      error: 'Failed after all retry attempts'
    };
  }

  /**
   * Create a controlled prompt for food image generation
   * Following requirement 3.2: "A high-quality food photo of [Dish Name], served on a white ceramic plate, isolated on transparent background, top-down/angled view"
   */
  private createFoodPrompt(itemName: string, description?: string, cuisine?: string): string {
    let prompt = `A high-quality food photo of ${itemName}`;
    
    if (description) {
      prompt += ` (${description})`;
    }
    
    if (cuisine) {
      prompt += ` in ${cuisine} style`;
    }
    
    prompt += ', served on a white ceramic plate, isolated on transparent background, 45% angled view. Professional food photography with appetizing presentation and excellent lighting.';
    
    return prompt;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.generateMenuItemImage('test dish', 'a simple test dish');
      return { success: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export a singleton instance
export const googleNanoBananaService = new GoogleNanoBananaService();