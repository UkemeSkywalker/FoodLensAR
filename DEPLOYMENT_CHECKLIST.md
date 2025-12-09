# AWS App Runner Deployment Checklist

## Pre-Deployment Steps

### 1. Configure S3 Bucket (One-time setup)

#### Add CORS Configuration
Go to S3 Console → `food-lens-image-gen` bucket → Permissions → CORS:

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

#### Add Bucket Policy
Go to S3 Console → `food-lens-image-gen` bucket → Permissions → Bucket Policy:

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

#### Disable Block Public Access
Go to S3 Console → `food-lens-image-gen` bucket → Permissions → Block public access:
- Uncheck "Block all public access"
- Save changes

---

## App Runner Configuration

### Build-Time Environment Variables
⚠️ **Set these in the BUILD configuration section:**

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `[YOUR_SUPABASE_URL]` | Supabase API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[YOUR_SUPABASE_ANON_KEY]` | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | `[YOUR_APP_RUNNER_URL]` | **Your App Runner URL** |

**Why NEXT_PUBLIC_APP_URL is critical:**
- Used to generate QR codes with correct customer menu URLs
- Tells Lambda where to fetch menu data from
- Used for password reset email links

---

### Runtime Environment Variables
⚠️ **Set these in the RUNTIME configuration section:**

| Variable | Value |
|----------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | `[YOUR_SUPABASE_SERVICE_ROLE_KEY]` |
| `AWS_ACCESS_KEY_ID` | `[YOUR_AWS_ACCESS_KEY_ID]` |
| `AWS_SECRET_ACCESS_KEY` | `[YOUR_AWS_SECRET_ACCESS_KEY]` |
| `AWS_REGION` | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | `food-lens-image-gen` |
| `GOOGLE_NANO_BANANA_API_KEY` | `º
| `GOOGLE_NANO_BANANA_API_URL` | `https://api.google.nano-banana.com/v1` |
| `STRANDS_LAMBDA_FUNCTION_NAME` | `food-lens-strands-agent` |
| `FOOD_LENS_API_ENDPOINT` | `[YOUR_APP_RUNNER_URL]` |
| `USDA_API_KEY` | `[YOUR_USDA_API_KEY]` |
| `ELEVENLABS_API_KEY` | `[YOUR_ELEVENLABS_API_KEY]` |
| `ELEVENLABS_VOICE_ID` | `[YOUR_ELEVENLABS_VOICE_ID]` |
| `APP_URL` | `[YOUR_APP_RUNNER_URL]` |
| `PORT` | `3000` |
| `HOSTNAME` | `0.0.0.0` |
| `NODE_ENV` | `production` |

---

## Deployment Steps

### 1. Push Code to Repository
```bash
git add .
git commit -m "Fix App Runner deployment - bind to 0.0.0.0"
git push origin main
```

### 2. Update App Runner Service

#### Option A: Via AWS Console
1. Go to AWS App Runner Console
2. Select your service
3. Click "Configuration" → "Edit"
4. Update **Build-time** environment variables (see table above)
5. Update **Runtime** environment variables (see table above)
6. Click "Save" and wait for deployment

#### Option B: Via AWS CLI
```bash
# Update service configuration
aws apprunner update-service \
  --service-arn <your-service-arn> \
  --source-configuration file://apprunner-config.json
```

### 3. Verify Deployment

#### Check Logs
Look for this in App Runner logs:
```
✓ Ready in XXXms
- Local:        http://0.0.0.0:3000
- Network:      http://0.0.0.0:3000
```

❌ **BAD** (old behavior):
```
- Network:      http://ip-10-0-47-191.ec2.internal:3000
```

✅ **GOOD** (fixed):
```
- Network:      http://0.0.0.0:3000
```

#### Test Endpoints
```bash
# Health check
curl https://dxmpdhv9gm.us-east-1.awsapprunner.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","service":"food-lens-mvp","version":"1.0.0"}

# Test main page
curl https://dxmpdhv9gm.us-east-1.awsapprunner.com

# Test QR code generation (requires auth)
# Login first, then:
curl -X POST https://dxmpdhv9gm.us-east-1.awsapprunner.com/api/restaurants/qr-code \
  -H "Cookie: <your-session-cookie>"
```

---

## Troubleshooting

### Issue: Server binding to internal hostname
**Symptom:** Logs show `http://ip-10-0-47-191.ec2.internal:3000`

**Solution:**
- Verify Dockerfile has: `CMD ["sh", "-c", "HOSTNAME=0.0.0.0 PORT=3000 node server.js"]`
- Verify runtime env vars include `HOSTNAME=0.0.0.0`
- Redeploy the service

### Issue: Images not loading
**Symptom:** Timeout errors when loading images from S3

**Solution:**
1. Check S3 CORS configuration (see above)
2. Check S3 bucket policy allows public reads
3. Verify "Block public access" is disabled
4. Check image URLs in browser console

### Issue: QR codes have wrong URLs
**Symptom:** QR codes point to localhost or wrong domain

**Solution:**
- Verify `NEXT_PUBLIC_APP_URL` is set as **BUILD-TIME** variable
- Verify `APP_URL` is set as **RUNTIME** variable (this is what QR code API uses)
- Both must be: `https://dxmpdhv9gm.us-east-1.awsapprunner.com`
- Redeploy and regenerate QR code in dashboard

### Issue: Lambda can't reach Next.js API
**Symptom:** AI queries fail with connection errors

**Solution:**
- Verify `FOOD_LENS_API_ENDPOINT` runtime variable is set correctly
- Should be: `https://dxmpdhv9gm.us-east-1.awsapprunner.com`
- Check Lambda has internet access (not in VPC, or VPC has NAT gateway)

---

## Post-Deployment Verification

### 1. Test User Flow
1. Sign up / Login at: `https://dxmpdhv9gm.us-east-1.awsapprunner.com/auth/signup`
2. Add a menu item
3. Generate image for menu item
4. Generate QR code
5. Scan QR code with phone
6. Verify customer menu loads with images
7. Test AI chat on customer menu

### 2. Monitor Logs
```bash
# View App Runner logs
aws logs tail /aws/apprunner/<service-name> --follow
```

### 3. Check Metrics
- Response times
- Error rates
- Memory usage
- CPU usage

---

## Rollback Plan

If deployment fails:

1. **Via Console:**
   - Go to App Runner service
   - Click "Deployments" tab
   - Select previous successful deployment
   - Click "Redeploy"

2. **Via Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## Security Notes

⚠️ **Production Best Practices:**
- Rotate all API keys and secrets regularly
- Use AWS Secrets Manager for sensitive values
- Enable AWS App Runner encryption at rest
- Set up CloudWatch alarms for errors
- Enable AWS WAF for DDoS protection
- Use IAM roles instead of access keys where possible

---

## Next Steps After Deployment

1. **Set up custom domain** (optional)
   - Configure Route 53 or your DNS provider
   - Add custom domain in App Runner
   - Update `NEXT_PUBLIC_APP_URL` to use custom domain

2. **Enable monitoring**
   - Set up CloudWatch dashboards
   - Configure SNS alerts for errors
   - Enable X-Ray tracing

3. **Performance optimization**
   - Enable CloudFront CDN for static assets
   - Configure S3 lifecycle policies for old images
   - Set up database connection pooling

4. **Backup strategy**
   - Regular Supabase database backups
   - S3 versioning for images
   - Document restore procedures
