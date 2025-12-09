"""
AWS Lambda handler for Food Lens Strands Agent service.
Provides AI-powered food advisory with custom tools for dish information,
nutrition lookup, and dietary advice.
"""

import json
import os
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from strands import Agent
    from tools.dish_info import get_dish_info
    from tools.smart_nutrition import smart_nutrition_lookup
    from tools.dietary_advice import dietary_advice
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    raise

# System prompt for the Food Lens AI advisor
FOOD_ADVISOR_SYSTEM_PROMPT = """You are a friendly food advisor for Food Lens restaurants. You help customers understand menu items, provide nutritional information, and offer dietary guidance.

When responding:
- Be concise and friendly (responses should be suitable for voice synthesis)
- ALWAYS provide a helpful response - never return empty or "no response" answers
- Use fast_nutrition_lookup for ALL nutritional queries - it provides instant responses
- Always include medical disclaimers for health/allergy questions
- Format responses for voice synthesis (avoid special characters, use natural language)
- Focus on the specific restaurant's menu items using get_dish_info when relevant
- Use dietary_advice tool for health-related guidance with proper disclaimers

Available tools:
- get_dish_info: Get detailed information about specific menu items from the restaurant
- smart_nutrition_lookup: Get comprehensive nutritional data for any food item (uses cache + API + web search)
- dietary_advice: Provide dietary guidance with appropriate medical disclaimers

Tool usage strategy:
1. Use smart_nutrition_lookup for ALL nutritional queries - it tries multiple sources for comprehensive coverage
2. Always provide helpful information, even for uncommon foods
3. Keep responses concise but informative
4. Always provide helpful information - never return empty responses

Always prioritize food safety and include disclaimers when discussing allergies or medical conditions."""


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for Food Lens Strands Agent.
    
    Args:
        event: Lambda event containing prompt and context
        context: Lambda context object
        
    Returns:
        Dict containing response and context information
    """
    try:
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Extract prompt and context from event
        prompt = event.get('prompt', '')
        restaurant_context = event.get('context', {})
        
        if not prompt:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing prompt in request'
                })
            }
        
        # Set API endpoint from context if available
        if restaurant_context.get('menuApiEndpoint'):
            os.environ['FOOD_LENS_API_ENDPOINT'] = restaurant_context['menuApiEndpoint']
        
        # Initialize Strands Agent with smart tools
        agent = Agent(
            system_prompt=FOOD_ADVISOR_SYSTEM_PROMPT,
            tools=[get_dish_info, smart_nutrition_lookup, dietary_advice],
        )
        
        # Add context to prompt if available
        enhanced_prompt = prompt
        if restaurant_context.get('dishId'):
            enhanced_prompt = f"""Context: Restaurant ID {restaurant_context['restaurantId']}, Dish ID {restaurant_context['dishId']}, Dish Name: {restaurant_context.get('dishName', 'Unknown')}. 

Customer Query: {prompt}

Instructions: Use get_dish_info tool with dish_id="{restaurant_context['dishId']}" and restaurant_id="{restaurant_context['restaurantId']}" to get detailed information about this specific menu item before answering."""
        elif restaurant_context.get('restaurantId'):
            enhanced_prompt = f"Context: Restaurant ID {restaurant_context['restaurantId']}. Customer Query: {prompt}"
        
        logger.info(f"Processing enhanced prompt: {enhanced_prompt}")
        
        # Get response from agent with timeout handling
        import signal
        
        def timeout_handler(signum, frame):
            raise TimeoutError("Agent processing timed out")
        
        # Set a 80-second timeout (10 seconds before Lambda timeout)
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(80)
        
        try:
            response = agent(enhanced_prompt)
            signal.alarm(0)  # Cancel the alarm
            
            logger.info(f"Agent response: {str(response)}")
            
            # Ensure we always have a valid response
            response_text = str(response).strip()
            if not response_text or response_text.lower() in ['none', 'null', '']:
                response_text = "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question, and I'll do my best to help you with nutritional information or menu guidance."
                
        except TimeoutError:
            signal.alarm(0)  # Cancel the alarm
            logger.warning("Agent processing timed out, providing fallback response")
            response_text = f"I understand you're asking about {prompt}. While I'm processing your request, I can tell you that I'm here to help with nutritional information and menu guidance. Please try asking about specific food items or nutritional aspects, and I'll provide detailed information."
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'response': response_text,
                'context': restaurant_context
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}'
            })
        }


# For local testing
if __name__ == "__main__":
    # Test event
    test_event = {
        'prompt': 'Tell me about the nutritional content of pizza',
        'context': {
            'restaurantId': 'test-restaurant-123'
        }
    }
    
    result = handler(test_event, None)
    print(json.dumps(result, indent=2))