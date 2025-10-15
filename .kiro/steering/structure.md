# Project Structure & Conventions

## Directory Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── restaurants/   # Restaurant management (includes QR code generation)
│   │   ├── health/        # Health check endpoints
│   │   └── setup-database/ # Database utilities
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Restaurant dashboard
│   ├── menu/              # Customer-facing menu pages
│   ├── admin/             # Admin utilities
│   └── page.tsx           # Landing page
├── components/            # Reusable React components
├── lib/                   # Library configurations
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Naming Conventions

### Files & Folders
- **API Routes**: Use Next.js App Router convention (`route.ts`)
- **Pages**: Use `page.tsx` for route pages
- **Components**: PascalCase (e.g., `AuthGuard.tsx`)
- **Utilities**: camelCase (e.g., `database.ts`)
- **Types**: Use `index.ts` for exports

### Database
- **Tables**: snake_case (e.g., `menu_items`, `restaurants`)
- **Columns**: snake_case with descriptive names
- **Primary Keys**: Always `id UUID` with `gen_random_uuid()`
- **Timestamps**: `created_at` and `updated_at` with timezone
- **QR Codes**: Store as `qr_code_url TEXT` in restaurants table, pointing to S3 stored images

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