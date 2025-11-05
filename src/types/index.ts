// Type definitions for the application

export interface Restaurant {
  id: string;
  name: string;
  email: string;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  ingredients?: string[];
  description?: string;
  cuisine?: string;
  image_url?: string;
  image_generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface AIQueryRequest {
  query: string;
  dishContext?: {
    itemId: string;
    name: string;
  };
  restaurantId: string;
}

export interface AIQueryResponse {
  textResponse: string;
  audioUrl?: string;
  nutritionData?: NutritionInfo;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}