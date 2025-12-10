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
- **AWS Lambda** with **Strands Agents Python SDK** for intelligent food advisory
- **AWS Bedrock** for LLM inference (via Strands Agent)
- **ElevenLabs TTS** for voice synthesis
- **AWS S3** for image storage (includes QR code images and 3D model files)
- **USDA FoodData Central API** for nutritional information

## AR & 3D Visualization
- **WebXR Device API** for augmented reality experiences
- **three.js** (r126+) for 3D rendering and scene management
- **GLTFLoader** for loading 3D models in GLTF format
- **Hit testing** for placing 3D models on real-world surfaces
- Mobile AR support for iOS and Android devices

## Development Tools
- **ESLint** for code linting
- **TypeScript 5** for type safety
- **Docker** for containerization
- **Hot reloading** enabled for rapid development

## QR Code Generation
- **qrcode** npm package for server-side QR code generation
- QR codes stored as PNG images in S3
- Customer menu URLs encoded in QR codes for easy scanning

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
- AWS Lambda function name for Strands Agent
- USDA FoodData Central API key
- ElevenLabs API key

## Deployment
- **AWS App Runner** for Next.js application deployment
- **AWS Lambda** for Strands Agent Python service
- **AWS CDK** for Lambda infrastructure deployment
- **CloudWatch** for logging and monitoring
- **AWS Secrets Manager** for production secrets

## Lambda Service Architecture
- **Python 3.12** runtime for Strands Agent Lambda
- **ARM64** architecture for cost optimization
- **Strands Agents SDK** for AI agent functionality
- **Custom tools** for dish info, nutrition lookup, and dietary advice
- **Lambda layers** for dependency management