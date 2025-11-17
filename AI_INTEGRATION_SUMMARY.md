# AI Food Advisor Integration Summary

## Overview
The AI Food Advisor integration has been successfully implemented, connecting the Next.js frontend to the AWS Lambda Strands Agent service for intelligent food advisory.

## Implementation Details

### 1. API Route (`/api/ai/query`)
**Location:** `src/app/api/ai/query/route.ts`

**Features:**
- POST endpoint for AI queries with Lambda invocation
- GET endpoint for health check
- AWS Lambda client integration using `@aws-sdk/client-lambda`
- Request payload formatting with restaurant and dish context
- Response processing with error handling
- Fallback responses for Lambda failures

**Request Format:**
```typescript
{
  query: string,              // Required: User's question
  restaurantId: string,       // Required: Restaurant context
  dishContext?: {             // Optional: Specific dish context
    itemId: string,
    name: string
  }
}
```

**Response Format:**
```typescript
{
  textResponse: string,       // AI-generated response
  audioUrl?: string,          // TTS audio (future implementation)
  nutritionData?: object      // Nutrition data (if available)
}
```

### 2. Test Interface (`/ai-test`)
**Location:** `src/app/ai-test/page.tsx`

**Features:**
- Health check button to verify service status
- Form inputs for query, restaurant ID, dish context
- Sample queries for quick testing
- Visual response display with error handling
- Support for audio playback (when implemented)
- Nutrition data display (when available)

**Sample Queries Included:**
- General Nutrition: "Tell me about the nutritional content of pizza"
- Health Benefits: "What are the health benefits of salmon?"
- Calorie Information: "How many calories are in a burger?"
- Dietary Restrictions: "I'm diabetic, what should I avoid?"
- Allergen Information: "I'm allergic to nuts, is this dish safe?"

### 3. Lambda Integration
**Lambda Function:** `food-lens-strands-agent`
**Region:** `us-east-1`

**Tools Available:**
- `get_dish_info`: Fetch menu item details from Food Lens API
- `smart_nutrition_lookup`: Get nutritional data using cache + API + web search
- `dietary_advice`: Provide dietary guidance with medical disclaimers

**Context Passing:**
- Restaurant ID for restaurant-specific queries
- Dish ID and name for item-specific questions
- Menu API endpoint for tool access

## Testing

### Integration Tests
**Script:** `test-ai-integration.js`

**Test Coverage:**
1. ✅ Health check endpoint
2. ✅ Input validation (missing required fields)
3. ✅ Basic nutrition queries
4. ✅ Dietary restriction queries
5. ✅ Dish context queries

**Run Tests:**
```bash
node test-ai-integration.js
```

### Manual Testing
1. Start development server: `npm run dev`
2. Navigate to: `http://localhost:3000/ai-test`
3. Enter a restaurant ID (any UUID format)
4. Enter a query or use sample queries
5. Optionally add dish context
6. Click "Ask AI Food Advisor"
7. View response with visual feedback

## Environment Variables Required

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Lambda Configuration
STRANDS_LAMBDA_FUNCTION_NAME=food-lens-strands-agent

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Error Handling

### API Level
- Network errors: Retry mechanisms with exponential backoff
- Lambda errors: Graceful fallback with user-friendly messages
- Validation errors: 400 status with clear error messages
- Timeout handling: 30-second Lambda timeout with fallback

### UI Level
- Loading states during query processing
- Error display with details
- Fallback text responses when Lambda fails
- Health check for service status verification

## Features Implemented

✅ API route for handling AI queries with Lambda invocation
✅ AWS Lambda client for invoking Strands Agent function
✅ Request payload formatting with restaurant and dish context
✅ Response processing and error handling for Lambda failures
✅ Dish context passing for targeted queries
✅ Simple test interface for AI queries in dashboard
✅ Visual feedback for all query types
✅ Health check endpoint for service monitoring

## Future Enhancements

### Planned (Not in Current Task)
- [ ] ElevenLabs TTS integration for audio responses
- [ ] Nutrition data extraction and display
- [ ] Chat interface with message history
- [ ] Voice playback controls
- [ ] Integration into customer menu pages

## Usage Examples

### Basic Query
```javascript
const response = await fetch('/api/ai/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Tell me about the nutritional content of pizza",
    restaurantId: "123e4567-e89b-12d3-a456-426614174000"
  })
});

const data = await response.json();
console.log(data.textResponse);
```

### Query with Dish Context
```javascript
const response = await fetch('/api/ai/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "How many calories does this have?",
    restaurantId: "123e4567-e89b-12d3-a456-426614174000",
    dishContext: {
      itemId: "456e7890-e12b-34d5-a678-901234567890",
      name: "Margherita Pizza"
    }
  })
});

const data = await response.json();
console.log(data.textResponse);
```

## Test Results

All integration tests passed successfully:
- ✅ Health check endpoint responding correctly
- ✅ Input validation working as expected
- ✅ Basic nutrition queries returning responses
- ✅ Dietary restriction queries handled properly
- ✅ Dish context queries processed correctly

## Access Points

- **Test Interface:** http://localhost:3000/ai-test
- **API Endpoint:** http://localhost:3000/api/ai/query
- **Health Check:** http://localhost:3000/api/ai/query (GET)

## Notes

- The Lambda function must be deployed and accessible for the integration to work
- AWS credentials must be properly configured in environment variables
- The test interface is designed for development and testing purposes
- Production deployment should include proper authentication and rate limiting
