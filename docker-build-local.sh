#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
else
    echo "Error: .env.local file not found"
    exit 1
fi

# Build Docker image with build arguments from .env.local for AWS App Runner
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  -t food-lens-mvp:v1.0.3 \
  .

echo "Docker image built successfully as 'food-lens-mvp:local' for AWS App Runner (linux/amd64)"
echo ""
echo "To run the container locally:"
echo "docker run --env-file .env.local -p 3000:3000 food-lens-mvp:local"
echo ""
echo "To tag for ECR and push to AWS App Runner:"
echo "docker tag food-lens-mvp:local <your-ecr-repo>:latest"
echo "docker push <your-ecr-repo>:latest"