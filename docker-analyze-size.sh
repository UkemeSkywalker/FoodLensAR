#!/bin/bash

echo "Analyzing Docker image size..."
echo ""

# Build the image
echo "Building image..."
./docker-build-local.sh

echo ""
echo "=== Image Size Analysis ==="
docker images food-lens-mvp:local --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "=== Layer Sizes ==="
docker history food-lens-mvp:local --human=true --format "table {{.Size}}\t{{.CreatedBy}}" | head -20

echo ""
echo "=== Checking what's in the final image ==="
docker run --rm food-lens-mvp:local du -sh /* 2>/dev/null | sort -h

echo ""
echo "=== Node modules size in final image ==="
docker run --rm food-lens-mvp:local du -sh /app/node_modules 2>/dev/null || echo "Using standalone build - no node_modules"

echo ""
echo "=== .next directory size ==="
docker run --rm food-lens-mvp:local du -sh /app/.next 2>/dev/null
