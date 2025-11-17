import { NextRequest, NextResponse } from 'next/server'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'

// Initialize Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
})

interface AIQueryRequest {
  query: string
  dishContext?: {
    itemId: string
    name: string
  }
  restaurantId: string
}

interface AIQueryResponse {
  textResponse: string
  audioUrl?: string
  nutritionData?: any
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AIQueryRequest = await request.json()
    const { query, dishContext, restaurantId } = body

    // Validate required fields
    if (!query || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields: query and restaurantId' },
        { status: 400 }
      )
    }

    // Prepare Lambda payload
    const lambdaPayload = {
      prompt: query,
      context: {
        restaurantId,
        ...(dishContext && {
          dishId: dishContext.itemId,
          dishName: dishContext.name
        }),
        menuApiEndpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api`
      }
    }

    console.log('Invoking Lambda with payload:', JSON.stringify(lambdaPayload, null, 2))

    // Invoke Lambda function
    const command = new InvokeCommand({
      FunctionName: process.env.STRANDS_LAMBDA_FUNCTION_NAME || 'food-lens-strands-agent',
      Payload: JSON.stringify(lambdaPayload),
      InvocationType: 'RequestResponse'
    })

    const lambdaResponse = await lambdaClient.send(command)

    // Parse Lambda response
    if (!lambdaResponse.Payload) {
      throw new Error('No response from Lambda function')
    }

    const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload))
    console.log('Lambda response:', responsePayload)

    // Handle Lambda errors
    if (responsePayload.statusCode && responsePayload.statusCode !== 200) {
      const errorBody = JSON.parse(responsePayload.body || '{}')
      throw new Error(errorBody.error || 'Lambda function error')
    }

    // Extract response from Lambda
    let textResponse: string
    let context: any = {}

    if (responsePayload.body) {
      // Lambda returned HTTP response format
      const parsedBody = JSON.parse(responsePayload.body)
      textResponse = parsedBody.response || parsedBody.textResponse || 'I apologize, but I encountered an issue processing your request. Please try asking about specific nutritional information or menu items, and I\'ll do my best to help.'
      context = parsedBody.context || {}
    } else {
      // Lambda returned direct response
      textResponse = responsePayload.response || responsePayload.textResponse || 'I apologize, but I encountered an issue processing your request. Please try asking about specific nutritional information or menu items, and I\'ll do my best to help.'
      context = responsePayload.context || {}
    }

    // Additional safety check
    if (!textResponse || textResponse.trim() === '') {
      textResponse = 'I\'m here to help with nutritional information and menu guidance. Could you please rephrase your question or ask about a specific food item?'
    }

    // Prepare API response
    const apiResponse: AIQueryResponse = {
      textResponse,
      // TODO: Implement TTS integration for audioUrl
      // audioUrl: undefined,
      // TODO: Extract nutrition data if available
      // nutritionData: context.nutritionData
    }

    return NextResponse.json(apiResponse)

  } catch (error) {
    console.error('Error processing AI query:', error)
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI query',
        details: errorMessage,
        textResponse: 'I apologize, but I\'m unable to process your request at this time. Please try again later.'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint for AI service
export async function GET() {
  try {
    // Check if Lambda function is configured
    const functionName = process.env.STRANDS_LAMBDA_FUNCTION_NAME
    const awsRegion = process.env.AWS_REGION
    
    if (!functionName) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Lambda function not configured',
          details: 'STRANDS_LAMBDA_FUNCTION_NAME environment variable not set'
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      service: 'AI Query Service',
      lambdaFunction: functionName,
      region: awsRegion,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI service health check failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}