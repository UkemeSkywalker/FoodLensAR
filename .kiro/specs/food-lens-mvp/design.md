# Design Document

## Overview

Food Lens MVP is a containerized Next.js application that enables restaurants to upload menus and automatically generate high-quality food images using AI. The platform integrates AWS Strands Agent for intelligent food advisory and ElevenLabs for voice synthesis, providing an engaging customer experience. The system is designed for real-time development with hot reloading and deployed on AWS App Runner for scalability.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend"
        UI[Next.js Frontend]
        DEV[Development Server]
    end
    
    subgraph "Backend APIs"
        API[Next.js API Routes]
        AUTH[Supabase Auth]
    end
    
    subgraph "External Services"
        NANO[Google Nano Banana API]
        STRANDS[AWS Strands Agent]
        TTS[ElevenLabs TTS]
    end
    
    subgraph "Data Layer"
        DB[(Supabase PostgreSQL)]
        S3[(AWS S3)]
    end
    
    UI --> API
    DEV --> UI
    API --> AUTH
    API --> NANO
    API --> STRANDS
    API --> TTS
    API --> DB
    API --> S3
    
    STRANDS --> API
```

### System Flow

1. **Restaurant Onboarding**: Supabase Auth → Restaurant Profile Creation
2. **Menu Management**: CRUD operations via Next.js API → Supabase Database
3. **Image Generation**: Menu Item Creation → Google Nano Banana API → AWS S3 Storage
4. **AI Food Advisory**: User Query → AWS Strands Agent → Nutrition/Dish APIs → Response
5. **Voice Synthesis**: Text Response → ElevenLabs TTS → Audio Playback

## Components and Interfaces

### Frontend Components

#### Core Pages
- **Landing Page** (`/`): Marketing and authentication entry point
- **Restaurant Dashboard** (`/dashboard`): Menu management interface
- **Menu View** (`/menu/[restaurantId]`): Customer-facing menu display
- **AI Chat Interface** (`/menu/[restaurantId]/chat`): Food advisory interaction

#### Reusable Components
- **MenuItemCard**: Displays menu item with generated image, price, and details
- **ChatInterface**: AI conversation UI with voice playback controls
- **ImageUploadFallback**: Handles image generation states and fallbacks
- **AuthGuard**: Protects restaurant-only routes

### Backend API Endpoints

#### Authentication & Restaurant Management
```typescript
// /api/auth/signup
POST: { email: string, password: string, restaurantName: string }
Response: { user: User, restaurant: Restaurant }

// /api/restaurants/profile
GET: Restaurant profile data
PUT: Update restaurant information
```

#### Menu Management
```typescript
// /api/menu
POST: { name: string, price: number, ingredients?: string[], description?: string }
Response: { menuItem: MenuItem, imageGenerationStatus: string }

GET: { restaurantId: string }
Response: { menuItems: MenuItem[] }

// /api/menu/[itemId]
PUT: Update menu item
DELETE: Remove menu item and associated S3 images
```

#### AI & Voice Services
```typescript
// /api/ai/query
POST: { 
  query: string, 
  dishContext?: { itemId: string, name: string },
  restaurantId: string 
}
Response: { 
  textResponse: string, 
  audioUrl?: string,
  nutritionData?: NutritionInfo 
}
```

### AWS Strands Agent Design

#### Agent Configuration
```python
# Food Advisor Agent
agent_name = "DishAI_FoodAdvisor"
agent_description = "Friendly food advisor providing dish information and nutrition guidance"

# Custom Tools
@tool
async def get_dish_info(dish_id: str, tool_context: ToolContext) -> dict:
    """Fetch detailed menu item information from Supabase."""
    # Implementation connects to Next.js API endpoint
    
@tool  
async def nutrition_lookup(food_name: str, ingredients: list) -> dict:
    """Get nutritional information using USDA API."""
    # Implementation calls external nutrition API
    
@tool
async def dietary_advice(query: str, dietary_restrictions: list) -> str:
    """Provide dietary guidance with appropriate disclaimers."""
    # Implementation includes medical disclaimers
```

#### Agent Response Format
- Concise, friendly tone
- Dietary-aware recommendations
- Automatic medical disclaimers for allergy/health queries
- Structured responses for voice synthesis

## Data Models

### Database Schema (Supabase)

```sql
-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    ingredients TEXT[],
    description TEXT,
    image_url TEXT,
    image_generation_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Restaurants can only see their own data" ON restaurants
    FOR ALL USING (auth.uid()::text = email);

CREATE POLICY "Restaurants can only manage their menu items" ON menu_items
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE email = auth.uid()::text
        )
    );
```

### TypeScript Interfaces

```typescript
interface Restaurant {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  ingredients?: string[];
  description?: string;
  image_url?: string;
  image_generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface AIQueryRequest {
  query: string;
  dishContext?: {
    itemId: string;
    name: string;
  };
  restaurantId: string;
}

interface AIQueryResponse {
  textResponse: string;
  audioUrl?: string;
  nutritionData?: NutritionInfo;
}
```

## Error Handling

### Frontend Error Handling
- **Network Errors**: Retry mechanisms with exponential backoff
- **Authentication Errors**: Automatic redirect to login with context preservation
- **Image Loading Errors**: Graceful fallback to placeholder images
- **Voice Playback Errors**: Silent fallback to text-only responses

### Backend Error Handling
- **External API Failures**: Graceful degradation without blocking core functionality
- **Database Connection Issues**: Connection pooling and retry logic
- **Image Generation Failures**: Status tracking and manual retry options
- **Validation Errors**: Comprehensive input sanitization and error messages

### AWS Strands Agent Error Handling
- **Tool Execution Failures**: Fallback responses with error context
- **API Rate Limiting**: Queuing and retry mechanisms
- **Nutrition Data Unavailable**: Clear messaging about data limitations
- **Medical Disclaimers**: Automatic inclusion for health-related queries

## Testing Strategy

### Development Testing
- **Hot Reloading**: Immediate feedback for frontend and API changes
- **Mock Services**: Development-time mocks for external APIs
- **Database Seeding**: Consistent test data for development
- **Error Simulation**: Toggle switches for testing error scenarios

### Unit Testing (Optional)
- **API Route Testing**: Request/response validation
- **Component Testing**: React component behavior
- **Utility Function Testing**: Data transformation and validation
- **Agent Tool Testing**: Individual tool functionality

### Integration Testing (Optional)
- **End-to-End Workflows**: Complete user journeys
- **External API Integration**: Service connectivity and response handling
- **Database Operations**: CRUD operations and RLS policies
- **Authentication Flows**: Login, signup, and session management

### Performance Considerations
- **Image Optimization**: Next.js Image component with S3 CDN
- **API Response Caching**: Strategic caching for menu data
- **Database Query Optimization**: Indexed queries and connection pooling
- **Lazy Loading**: Progressive loading of menu items and images

## Security Implementation

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication with secure session management
- **Row Level Security**: Database-level isolation between restaurants
- **API Route Protection**: Middleware for authenticated endpoints
- **CORS Configuration**: Restricted origins for production deployment

### Data Protection
- **Input Sanitization**: Comprehensive validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Protection**: Content Security Policy and input encoding
- **Environment Variables**: Secure storage of API keys and secrets

### External Service Security
- **API Key Management**: AWS Secrets Manager for production keys
- **Rate Limiting**: Protection against API abuse
- **Signed URLs**: Secure S3 access with expiration
- **HTTPS Enforcement**: SSL/TLS for all external communications

## Deployment Architecture

### Development Environment
- **Next.js Dev Server**: Hot reloading on `localhost:3000`
- **Local Database**: Supabase local development setup
- **Environment Variables**: `.env.local` for development keys
- **Mock Services**: Local implementations of external APIs

### Production Deployment
- **AWS App Runner**: Containerized deployment with auto-scaling
- **Docker Configuration**: Multi-stage build for optimized images
- **Environment Management**: AWS Secrets Manager integration
- **Monitoring**: CloudWatch logs and metrics with Sentry error tracking

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and deployment
- **Container Registry**: AWS ECR for Docker image storage
- **Blue-Green Deployment**: Zero-downtime updates via App Runner
- **Health Checks**: Application and database connectivity monitoring