# Technology Stack

## Framework & Runtime
- **Next.js 15** with App Router and TypeScript
- **React 19** for UI components
- **Node.js** runtime environment
- **Turbopack** for fast builds and development

## Database & Authentication
- **Supabase** for PostgreSQL database and authentication
- **Row Level Security (RLS)** for data isolation between restaurants
- **UUID** primary keys with automatic generation

## Styling & UI
- **Tailwind CSS 4** for styling
- **Geist fonts** (Sans and Mono) from Google Fonts
- Responsive design patterns

## External Services
- **Google Nano Banana API** for AI image generation
- **AWS Strands Agent** for intelligent food advisory
- **ElevenLabs TTS** for voice synthesis
- **AWS S3** for image storage

## Development Tools
- **ESLint** for code linting
- **TypeScript 5** for type safety
- **Docker** for containerization
- **Hot reloading** enabled for rapid development

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint
```

### Docker
```bash
docker build -t food-lens-mvp .
docker-compose up
```

## Environment Variables
All external service credentials stored in `.env.local` for development:
- Supabase URL and keys
- AWS credentials and S3 bucket
- Google Nano Banana API key
- AWS Strands Agent endpoint
- ElevenLabs API key

## Deployment
- **AWS App Runner** for production deployment
- **CloudWatch** for logging and monitoring
- **AWS Secrets Manager** for production secrets