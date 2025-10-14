# Food Lens MVP

AI-Powered Restaurant Platform with automatic food image generation and intelligent food advisory.

## Features

- 🍽️ Restaurant menu management
- ✨ AI-powered food image generation (Google Nano Banana API)
- 🤖 Intelligent food advisory (AWS Strands Agent)
- 🎵 Voice responses (ElevenLabs TTS)
- 🔐 Secure authentication (Supabase Auth)
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: AWS S3
- **Authentication**: Supabase Auth
- **AI Services**: Google Nano Banana API, AWS Strands Agent, ElevenLabs TTS
- **Deployment**: Docker + AWS App Runner

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # Restaurant dashboard pages
│   ├── menu/             # Customer-facing menu pages
│   └── page.tsx          # Landing page
├── components/           # Reusable React components
├── lib/                 # Library configurations (Supabase, S3, etc.)
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Visit the application**:
   - Frontend: http://localhost:3000
   - Health check: http://localhost:3000/api/health

## Docker Setup

1. **Build the Docker image**:
   ```bash
   docker build -t food-lens-mvp .
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for all required environment variables:

- Supabase configuration
- AWS credentials and S3 bucket
- Google Nano Banana API key
- AWS Strands Agent endpoint
- ElevenLabs API key

## Development Features

- ✅ Hot reloading enabled
- ✅ TypeScript support
- ✅ Tailwind CSS configured
- ✅ Docker containerization ready
- ✅ API routes structure
- ✅ Component architecture
- ✅ Environment configuration

## Next Steps

1. Configure Supabase integration and authentication (Task 2)
2. Implement authentication system with UI (Task 3)
3. Build restaurant dashboard and menu management (Task 4)
4. Integrate AWS S3 for image storage (Task 5)
5. Implement Google Nano Banana API integration (Task 6)

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
- Application status
- Environment information
- Timestamp

This is useful for monitoring and deployment verification.