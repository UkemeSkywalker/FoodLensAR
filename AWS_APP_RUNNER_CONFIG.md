# AWS App Runner Configuration Guide

## Environment Variables for App Runner

Set these environment variables in your AWS App Runner service configuration:

### Build-time Variables (Build Configuration)
⚠️ **CRITICAL**: These must be set as BUILD-TIME variables in App Runner, not runtime variables!

```
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
NEXT_PUBLIC_APP_URL=[YOUR_APP_RUNNER_URL]
```

**What NEXT_PUBLIC_APP_URL is used for:**
- Client-side code and build-time references
- Lambda integration: Tells the AI Lambda function where to fetch menu data from
- Image generation API calls

**Note:** For QR code generation, we also need `APP_URL` as a runtime variable (see below)

### Runtime Variables (Runtime Configuration)
```
# Supabase
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# AWS Configuration
AWS_ACCESS_KEY_ID=[YOUR_AWS_ACCESS_KEY_ID]
AWS_SECRET_ACCESS_KEY=[YOUR_AWS_SECRET_ACCESS_KEY]
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=food-lens-image-gen

# Google Nano Banana API
GOOGLE_NANO_BANANA_API_KEY=[YOUR_GOOGLE_API_KEY]
GOOGLE_NANO_BANANA_API_URL=https://api.google.nano-banana.com/v1

# AWS Strands Agent
STRANDS_LAMBDA_FUNCTION_NAME=food-lens-strands-agent
FOOD_LENS_API_ENDPOINT=[YOUR_APP_RUNNER_URL]

# USDA FoodData Central API
USDA_API_KEY=[YOUR_USDA_API_KEY]

# ElevenLabs TTS
ELEVENLABS_API_KEY=[YOUR_ELEVENLABS_API_KEY]
ELEVENLABS_VOICE_ID=[YOUR_ELEVENLABS_VOICE_ID]

# Application URL (Runtime - for QR code generation)
APP_URL=[YOUR_APP_RUNNER_URL]

# Server Configuration
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
```

## App Runner Service Configuration

### Port Configuration
- **Port**: 3000
- **Protocol**: HTTP

### Health Check
- **Path**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Healthy threshold**: 1
- **Unhealthy threshold**: 3

### Instance Configuration
- **CPU**: 1 vCPU (minimum)
- **Memory**: 2 GB (minimum, 3-4 GB recommended for image generation)
- **Auto scaling**: 
  - Min instances: 1
  - Max instances: 3-5 (depending on expected load)

## Deployment Steps

1. **Update Dockerfile** (already done)
   - Ensures server binds to `0.0.0.0`
   - Sets proper environment variables

2. **Configure S3 CORS** (if not done)
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "HEAD"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": ["ETag"],
           "MaxAgeSeconds": 3000
       }
   ]
   ```

3. **Configure S3 Bucket Policy** (if not done)
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::food-lens-image-gen/*"
           }
       ]
   }
   ```

4. **Update App Runner Service**
   - Go to AWS App Runner Console
   - Select your service
   - Click "Configuration" → "Edit"
   - Update environment variables (both build-time and runtime)
   - Save and deploy

5. **Verify Deployment**
   - Check logs for: `- Network: http://0.0.0.0:3000`
   - Test health endpoint: `https://dxmpdhv9gm.us-east-1.awsapprunner.com/api/health`
   - Test main page: `https://dxmpdhv9gm.us-east-1.awsapprunner.com`

## Troubleshooting

### Server not binding to 0.0.0.0
- Verify `HOSTNAME=0.0.0.0` is set in runtime environment variables
- Check App Runner logs for the startup message
- Ensure Dockerfile has `ENV HOSTNAME=0.0.0.0`

### Images not loading
- Verify S3 CORS configuration
- Check S3 bucket policy allows public reads
- Verify `NEXT_PUBLIC_APP_URL` is set correctly in build-time variables

### Lambda integration failing
- Verify `FOOD_LENS_API_ENDPOINT` points to App Runner URL
- Check Lambda has proper IAM permissions
- Verify Lambda can reach App Runner (check VPC/security groups if applicable)

## Security Notes

⚠️ **Important**: The credentials in this file are for reference only. In production:
- Use AWS Secrets Manager or Parameter Store for sensitive values
- Rotate credentials regularly
- Use IAM roles instead of access keys where possible
- Enable AWS App Runner encryption at rest
