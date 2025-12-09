# Food Lens Strands Agent Lambda Service

This directory contains the AWS Lambda function that provides AI-powered food advisory services using the Strands Agents SDK.

## Architecture

- **Lambda Function**: `agent_handler.py` - Main handler with Strands Agent configuration
- **Custom Tools**: 
  - `tools/dish_info.py` - Fetch menu item information from Food Lens API
  - `tools/nutrition_lookup.py` - Get nutritional data from USDA FoodData Central API
  - `tools/dietary_advice.py` - Provide dietary guidance with medical disclaimers
- **Configuration**: `config.py` - Environment variables and settings
- **Deployment**: AWS CDK stack in `../cdk/` directory

## Local Development

### Prerequisites

1. Python 3.12+
2. AWS CLI configured
3. Node.js 18+ (for CDK)

### Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install CDK dependencies
cd ../cdk
npm install
```

### Environment Variables

Set these environment variables for local testing:

```bash
export FOOD_LENS_API_ENDPOINT="http://localhost:3000"
export USDA_API_KEY=
export AWS_REGION="us-east-1"
```

### Local Testing

```bash
# Run local tests
python test_local.py

# Test specific functionality
python test_local.py validate
```

## Deployment

### Option 1: AWS CDK (Recommended)

```bash
# Navigate to CDK directory
cd ../cdk

# Install CDK CLI if not already installed
npm install -g aws-cdk

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy

# Set context variables for deployment
cdk deploy --context food_lens_api_endpoint="https://your-domain.com" \
           --context usda_api_key="your_usda_api_key"
```

### Option 2: Manual Deployment

```bash
# Create deployment package
python package_for_lambda.py

# Upload deployment-package.zip to AWS Lambda console
# Set environment variables in Lambda configuration
# Configure IAM role with Bedrock permissions
```

## Environment Variables (Lambda)

Required:
- `FOOD_LENS_API_ENDPOINT` - URL of Food Lens API (e.g., https://your-domain.com)`

Optional:
- `FOOD_LENS_API_KEY` - API key for internal Food Lens API calls
- `USDA_API_KEY` - USDA FoodData Central API key for nutrition data
- `AWS_REGION` - AWS region (defaults to us-east-1)
- `LOG_LEVEL` - Logging level (defaults to INFO)

## IAM Permissions

The Lambda function requires these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:GetFoundationModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## Testing the Deployed Function

### From Next.js Application

Visit `http://localhost:3000/ai-test` to test the AI functionality through the web interface.

### Direct Lambda Invocation

```bash
# Test with AWS CLI
aws lambda invoke \
  --function-name food-lens-strands-agent \
  --payload '{"prompt":"Tell me about pizza nutrition","context":{"restaurantId":"test-123"}}' \
  response.json

cat response.json
```

### API Endpoint Testing

```bash
# Health check
curl -X GET http://localhost:3000/api/ai/query

# Query test
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about pizza nutrition", "restaurantId": "test-123"}'
```

## Monitoring

- **CloudWatch Logs**: `/aws/lambda/food-lens-strands-agent`
- **Metrics**: Lambda duration, errors, invocations
- **Tracing**: Enable X-Ray for detailed request tracing

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure Strands SDK is included in deployment package
2. **Timeout Errors**: Increase Lambda timeout (current: 30 seconds)
3. **Memory Errors**: Increase Lambda memory (current: 512 MB)
4. **Bedrock Permissions**: Verify IAM role has Bedrock access

### Debug Mode

Set `LOG_LEVEL=DEBUG` environment variable for detailed logging.

### Cost Optimization

- Uses ARM64 architecture for 20% cost savings
- 512 MB memory allocation balances performance and cost
- 30-second timeout prevents runaway executions

## Architecture Decisions

1. **ARM64**: Cost optimization without performance impact
2. **Strands Agents**: Provides robust AI agent framework with tool integration
3. **Custom Tools**: Modular design for easy extension and testing
4. **Error Handling**: Comprehensive error handling with user-friendly messages
5. **Medical Disclaimers**: Automatic inclusion for health-related queries