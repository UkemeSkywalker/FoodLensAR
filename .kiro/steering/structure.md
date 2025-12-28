# Project Structure & Conventions

## Directory Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── restaurants/   # Restaurant management (includes QR code generation)
│   │   ├── ai/            # AI query endpoints (Lambda integration)
│   │   ├── health/        # Health check endpoints
│   │   └── setup-database/ # Database utilities
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Restaurant dashboard
│   ├── menu/              # Customer-facing menu pages
│   ├── ar/                # AR viewer pages
│   ├── admin/             # Admin utilities
│   └── page.tsx           # Landing page
├── components/            # Reusable React components
│   ├── ar/                # AR-specific components (ARViewer, ARButton, etc.)
│   └── ...                # Other components
├── lib/                   # Library configurations
│   ├── webxr.ts          # WebXR initialization and utilities
│   └── ...                # Other libraries
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions

lambda/                     # AWS Lambda Strands Agent Service
├── agent_handler.py       # Main Lambda handler
├── tools/                 # Custom Strands Agent tools
│   ├── __init__.py
│   ├── dish_info.py      # Menu item information tool
│   ├── nutrition_lookup.py # USDA nutrition API tool
│   └── dietary_advice.py  # Dietary guidance tool
├── requirements.txt       # Python dependencies
├── config.py             # Configuration and constants
└── package_for_lambda.py # Lambda packaging script

cdk/                       # AWS CDK Infrastructure
├── app.py                # CDK app entry point
├── stacks/
│   └── lambda_stack.py   # Lambda deployment stack
├── requirements.txt      # CDK dependencies
└── cdk.json             # CDK configuration
```

## Naming Conventions

### Files & Folders
- **API Routes**: Use Next.js App Router convention (`route.ts`)
- **Pages**: Use `page.tsx` for route pages
- **Components**: PascalCase (e.g., `AuthGuard.tsx`)
- **Utilities**: camelCase (e.g., `database.ts`)
- **Types**: Use `index.ts` for exports
- **Lambda Functions**: snake_case (e.g., `agent_handler.py`)
- **Python Tools**: snake_case (e.g., `dish_info.py`)

### Database
- **Tables**: snake_case (e.g., `menu_items`, `restaurants`)
- **Columns**: snake_case with descriptive names
- **Primary Keys**: Always `id UUID` with `gen_random_uuid()`
- **Timestamps**: `created_at` and `updated_at` with timezone
- **QR Codes**: Store as `qr_code_url TEXT` in restaurants table, pointing to S3 stored images
- **3D Models**: Store as `model_url TEXT` in menu_items table, pointing to GLTF files in S3

## Code Patterns

### API Route Structure
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    // 2. Authenticate user if required
    // 3. Perform business logic
    // 4. Return structured response
  } catch (error) {
    console.error('Error context:', error)
    return NextResponse.json({ error: 'Message' }, { status: 500 })
  }
}
```

### Error Handling
- Always use try-catch blocks in API routes
- Log errors with context using `console.error`
- Return user-friendly error messages
- Use appropriate HTTP status codes

### Authentication
- Use `getAuthenticatedUserFromCookies()` for protected routes
- Return 401 for unauthorized access
- Match user email with restaurant data for authorization

### Database Operations
- Use Supabase client for all database operations
- Implement proper error handling for database queries
- Use `.single()` for single record queries
- Use `.select()` to specify returned fields

## Component Architecture

### Page Components
- Keep pages minimal, delegate to smaller components
- Use TypeScript interfaces for props
- Implement proper loading and error states

### Reusable Components
- Export from `src/components/index.ts`
- Use consistent prop interfaces
- Include proper TypeScript types

## Security Patterns

### Row Level Security
- Disable RLS in development for easier testing
- Enable RLS in production with proper policies
- Use email-based authorization matching

### Input Validation
- Validate all API inputs before processing
- Sanitize user inputs to prevent injection
- Use TypeScript for compile-time type checking

### Environment Variables
- Store all secrets in `.env.local` for development
- Use `NEXT_PUBLIC_` prefix only for client-side variables
- Validate required environment variables on startup
## 
QR Code Patterns

### QR Code Generation
- Use `qrcode` npm package for server-side generation
- Store generated QR code images in S3 with naming pattern: `qr-codes/{restaurant_id}.png`
- QR codes encode customer menu URLs: `https://domain.com/menu/{restaurant_id}`
- Generate QR codes on-demand or when restaurant updates menu

### Customer Menu Access
- Public routes at `/menu/[restaurantId]` require no authentication
- Use restaurant ID from URL to fetch menu items
- Implement proper error handling for invalid restaurant IDs
- Ensure RLS policies allow public read access to menu items for customer pages

### QR Code API Endpoints
- `POST /api/restaurants/qr-code` - Generate new QR code for authenticated restaurant
- `GET /api/restaurants/qr-code` - Retrieve existing QR code URL
- Include proper authentication and restaurant ownership validation

## Lambda Service Patterns

### Lambda Function Structure
```python
def handler(event, context):
    try:
        # 1. Parse event payload
        # 2. Initialize Strands Agent with tools
        # 3. Process query with context
        # 4. Return structured response
    except Exception as error:
        print(f'Lambda error: {error}')
        return {'error': str(error)}
```

### Custom Tool Implementation
```python
from strands_tools import tool

@tool
async def tool_name(param: str) -> dict:
    """Tool description for Strands Agent."""
    # 1. Validate input parameters
    # 2. Make external API calls if needed
    # 3. Process and format response
    # 4. Return structured data
```

### Lambda Integration from Next.js
```typescript
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

export async function invokeFoodAdvisor(query: string, context: object) {
  const command = new InvokeCommand({
    FunctionName: process.env.STRANDS_LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify({ prompt: query, context })
  });
  
  const response = await lambdaClient.send(command);
  return JSON.parse(new TextDecoder().decode(response.Payload));
}
```

### Lambda Deployment Patterns
- Use AWS CDK for infrastructure as code
- Package dependencies in Lambda layers for reusability
- Use ARM64 architecture for cost optimization
- Set appropriate timeout and memory limits
- Include proper IAM permissions for Bedrock and external APIs

## AR/WebXR Patterns

### Variant Launch AR Initialization
```typescript
// Include Variant Launch SDK in head
// <script src="https://launchar.app/sdk/v1?key=YOUR_SDK_KEY&redirect=true"></script>

async function initializeAR() {
  // Check if WebXR is available (via Variant Launch on iOS, native on Android)
  if (!navigator.xr) {
    throw new Error('AR not supported on this device');
  }
  
  // Request immersive AR session (works on both iOS and Android via Variant Launch)
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['local', 'anchors', 'dom-overlay', 'hit-test']
  });
  
  return session;
}
```

### 3D Model Loading
- Use GLTFLoader from three.js to load 3D models
- Store GLTF models in S3 with naming pattern: `models/{menu_item_id}.gltf`
- Implement fallback placeholder model for items without custom 3D models
- Default placeholder: `https://immersive-web.github.io/webxr-samples/media/gltf/camp/camp.gltf`

### AR Component Structure
```typescript
// AR viewer component should:
// 1. Initialize WebXR session with hit-test feature
// 2. Set up three.js scene with lighting
// 3. Load GLTF model for menu item
// 4. Implement hit testing for surface placement
// 5. Handle user tap events to place models
// 6. Render continuously in animation loop
```

### AR User Flow
1. Customer scans QR code → **Variant Launch handles iOS/Android differences**
2. **iOS**: App Clip downloads seamlessly, opens AR-enabled browser
3. **Android**: Direct WebXR support in Chrome
4. Customer lands on `/menu/[restaurantId]` with AR capability
5. Customer views menu items with 2D images
6. Customer clicks "View in AR" button on menu item
7. System navigates to `/ar/[menuItemId]` 
8. AR session starts immediately (no permission prompts needed)
9. User sees reticle on real-world surfaces
10. User taps to place 3D food model on surface
11. User can view model from all angles

### AR Database Schema
- Add `model_url` column to `menu_items` table for custom 3D models
- Use TEXT type to store S3 URLs or external GLTF URLs
- NULL values default to placeholder model

### AR API Endpoints
- `GET /api/menu/[itemId]/model` - Retrieve 3D model URL for menu item
- Returns model URL or default placeholder if not set