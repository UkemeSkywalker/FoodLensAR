"""
Tool for providing dietary guidance with appropriate medical disclaimers.
"""

import logging
from typing import Dict, Any, List, Optional
from strands import tool

logger = logging.getLogger(__name__)


@tool
def dietary_advice(query: str, dietary_restrictions: Optional[List[str]] = None, health_conditions: Optional[List[str]] = None) -> str:
    """
    Provide dietary guidance with appropriate medical disclaimers.
    
    Args:
        query: The dietary question or concern
        dietary_restrictions: List of dietary restrictions (e.g., vegetarian, gluten-free)
        health_conditions: List of health conditions mentioned (e.g., diabetes, allergies)
        
    Returns:
        String containing dietary advice with medical disclaimers
    """
    try:
        # Standard medical disclaimer
        medical_disclaimer = "⚠️ This is general information only. Always consult healthcare providers for medical advice, especially regarding allergies, medications, or health conditions."
        
        # Analyze query for health-related keywords
        health_keywords = [
            'allergy', 'allergic', 'diabetes', 'diabetic', 'blood pressure', 'hypertension',
            'cholesterol', 'heart', 'kidney', 'liver', 'medication', 'pregnant', 'pregnancy',
            'breastfeeding', 'celiac', 'gluten', 'lactose', 'intolerant', 'sensitivity',
            'weight loss', 'diet', 'keto', 'low carb', 'low sodium', 'low fat'
        ]
        
        query_lower = query.lower()
        has_health_concern = any(keyword in query_lower for keyword in health_keywords)
        
        # Build response based on query type
        response_parts = []
        
        if has_health_concern or health_conditions:
            response_parts.append("I understand you have specific dietary concerns.")
            
            # Allergy-specific advice
            if any(word in query_lower for word in ['allergy', 'allergic']):
                response_parts.append("For food allergies, it's crucial to inform restaurant staff about your specific allergies. Cross-contamination can occur in kitchens, so always verify ingredients and preparation methods.")
            
            # Diabetes-specific advice
            elif any(word in query_lower for word in ['diabetes', 'diabetic', 'blood sugar']):
                response_parts.append("For diabetes management, consider dishes with lean proteins, vegetables, and complex carbohydrates. Be mindful of hidden sugars in sauces and dressings.")
            
            # Heart health advice
            elif any(word in query_lower for word in ['heart', 'cholesterol', 'blood pressure']):
                response_parts.append("For heart health, look for grilled, baked, or steamed options. Consider dishes with less sodium and saturated fat.")
            
            # Weight management advice
            elif any(word in query_lower for word in ['weight loss', 'calories', 'diet']):
                response_parts.append("For weight management, consider portion sizes, cooking methods, and balance of nutrients. Grilled proteins with vegetables are often good choices.")
            
            # Gluten-related advice
            elif any(word in query_lower for word in ['gluten', 'celiac']):
                response_parts.append("For gluten concerns, verify that dishes and their ingredients are gluten-free. Cross-contamination can occur with shared cooking surfaces and utensils.")
            
            # General dietary restriction advice
            else:
                response_parts.append("When dining with dietary restrictions, don't hesitate to ask about ingredients, preparation methods, and possible substitutions.")
        
        else:
            # General dietary advice
            if 'healthy' in query_lower or 'nutrition' in query_lower:
                response_parts.append("For a balanced meal, consider including lean proteins, vegetables, whole grains, and healthy fats. Portion control and cooking methods also matter.")
            elif 'vegetarian' in query_lower or 'vegan' in query_lower:
                response_parts.append("Plant-based options can provide excellent nutrition. Look for dishes with legumes, nuts, seeds, and a variety of vegetables for complete nutrition.")
            else:
                response_parts.append("I'd be happy to help with your dietary question. Could you provide more specific details about what you're looking for?")
        
        # Add specific dietary restriction considerations
        if dietary_restrictions:
            restriction_advice = {
                'vegetarian': 'Vegetarian options should exclude meat, poultry, and fish.',
                'vegan': 'Vegan options should exclude all animal products including dairy, eggs, and honey.',
                'gluten-free': 'Gluten-free options should avoid wheat, barley, rye, and cross-contamination.',
                'dairy-free': 'Dairy-free options should exclude milk, cheese, butter, and other dairy products.',
                'nut-free': 'Nut-free options require careful attention to ingredients and cross-contamination.',
                'low-sodium': 'Low-sodium options should limit added salt and high-sodium ingredients.',
                'keto': 'Keto-friendly options should be high in fat, moderate in protein, and very low in carbs.'
            }
            
            for restriction in dietary_restrictions:
                if restriction.lower() in restriction_advice:
                    response_parts.append(restriction_advice[restriction.lower()])
        
        # Combine response parts
        main_response = " ".join(response_parts)
        
        # Add disclaimer
        full_response = f"{main_response}\n\n{medical_disclaimer}"
        
        logger.info(f"Provided dietary advice for query: {query[:50]}...")
        return full_response
        
    except Exception as e:
        logger.error(f"Error providing dietary advice: {str(e)}")
        return f"I apologize, but I'm unable to provide specific dietary advice at this time due to technical issues. {medical_disclaimer}"


# Synchronous wrapper for compatibility
def dietary_advice_sync(query: str, dietary_restrictions: Optional[List[str]] = None, health_conditions: Optional[List[str]] = None) -> str:
    """
    Synchronous wrapper for dietary_advice tool.
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(dietary_advice(query, dietary_restrictions, health_conditions))