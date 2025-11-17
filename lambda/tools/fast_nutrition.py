"""
Fast nutrition lookup with caching and fallbacks for better performance.
"""

import logging
from typing import Dict, Any, Optional
from strands import tool

logger = logging.getLogger(__name__)

# Pre-cached nutrition data for common foods (per 100g)
NUTRITION_CACHE = {
    'pizza': {
        'calories': 266, 'protein': 11.0, 'fat': 10.4, 'carbs': 33.0, 'fiber': 2.3, 'sodium': 598
    },
    'chicken': {
        'calories': 165, 'protein': 31.0, 'fat': 3.6, 'carbs': 0, 'fiber': 0, 'sodium': 74
    },
    'rice': {
        'calories': 130, 'protein': 2.7, 'fat': 0.3, 'carbs': 28.0, 'fiber': 0.4, 'sodium': 1
    },
    'white rice': {
        'calories': 130, 'protein': 2.7, 'fat': 0.3, 'carbs': 28.0, 'fiber': 0.4, 'sodium': 1
    },
    'beans': {
        'calories': 127, 'protein': 8.7, 'fat': 0.5, 'carbs': 23.0, 'fiber': 6.4, 'sodium': 2
    },
    'black beans': {
        'calories': 132, 'protein': 8.9, 'fat': 0.5, 'carbs': 24.0, 'fiber': 8.7, 'sodium': 2
    },
    'bread': {
        'calories': 265, 'protein': 9.0, 'fat': 3.2, 'carbs': 49.0, 'fiber': 2.7, 'sodium': 491
    },
    'pasta': {
        'calories': 131, 'protein': 5.0, 'fat': 1.1, 'carbs': 25.0, 'fiber': 1.8, 'sodium': 1
    },
    'beef': {
        'calories': 250, 'protein': 26.0, 'fat': 15.0, 'carbs': 0, 'fiber': 0, 'sodium': 72
    },
    'fish': {
        'calories': 206, 'protein': 22.0, 'fat': 12.0, 'carbs': 0, 'fiber': 0, 'sodium': 59
    },
    'salmon': {
        'calories': 208, 'protein': 20.0, 'fat': 13.0, 'carbs': 0, 'fiber': 0, 'sodium': 59
    },
    'egg': {
        'calories': 155, 'protein': 13.0, 'fat': 11.0, 'carbs': 1.1, 'fiber': 0, 'sodium': 124
    },
    'milk': {
        'calories': 42, 'protein': 3.4, 'fat': 1.0, 'carbs': 5.0, 'fiber': 0, 'sodium': 44
    },
    'cheese': {
        'calories': 113, 'protein': 7.0, 'fat': 9.0, 'carbs': 1.0, 'fiber': 0, 'sodium': 215
    },
    'yogurt': {
        'calories': 59, 'protein': 10.0, 'fat': 0.4, 'carbs': 3.6, 'fiber': 0, 'sodium': 36
    },
    'apple': {
        'calories': 52, 'protein': 0.3, 'fat': 0.2, 'carbs': 14.0, 'fiber': 2.4, 'sodium': 1
    },
    'banana': {
        'calories': 89, 'protein': 1.1, 'fat': 0.3, 'carbs': 23.0, 'fiber': 2.6, 'sodium': 1
    },
    'broccoli': {
        'calories': 34, 'protein': 2.8, 'fat': 0.4, 'carbs': 7.0, 'fiber': 2.6, 'sodium': 33
    },
    'spinach': {
        'calories': 23, 'protein': 2.9, 'fat': 0.4, 'carbs': 3.6, 'fiber': 2.2, 'sodium': 79
    },
    'potato': {
        'calories': 77, 'protein': 2.0, 'fat': 0.1, 'carbs': 17.0, 'fiber': 2.2, 'sodium': 6
    },
    'sweet potato': {
        'calories': 86, 'protein': 1.6, 'fat': 0.1, 'carbs': 20.0, 'fiber': 3.0, 'sodium': 54
    },
    'oats': {
        'calories': 389, 'protein': 17.0, 'fat': 7.0, 'carbs': 66.0, 'fiber': 10.0, 'sodium': 2
    },
    'quinoa': {
        'calories': 120, 'protein': 4.4, 'fat': 1.9, 'carbs': 22.0, 'fiber': 2.8, 'sodium': 7
    },
    'avocado': {
        'calories': 160, 'protein': 2.0, 'fat': 15.0, 'carbs': 9.0, 'fiber': 7.0, 'sodium': 7
    },
    'nuts': {
        'calories': 607, 'protein': 20.0, 'fat': 54.0, 'carbs': 16.0, 'fiber': 8.0, 'sodium': 18
    },
    'almonds': {
        'calories': 579, 'protein': 21.0, 'fat': 50.0, 'carbs': 22.0, 'fiber': 12.0, 'sodium': 1
    }
}

# Regional/cultural foods with estimated nutrition
REGIONAL_FOODS = {
    'amala': {
        'calories': 118, 'protein': 1.2, 'fat': 0.2, 'carbs': 27.0, 'fiber': 3.5, 'sodium': 5,
        'description': 'A Nigerian staple made from yam flour, rich in carbohydrates and dietary fiber'
    },
    'fufu': {
        'calories': 267, 'protein': 1.9, 'fat': 0.2, 'carbs': 65.0, 'fiber': 1.4, 'sodium': 15,
        'description': 'A West African staple made from cassava, high in carbohydrates'
    },
    'jollof rice': {
        'calories': 150, 'protein': 3.5, 'fat': 2.0, 'carbs': 30.0, 'fiber': 1.0, 'sodium': 400,
        'description': 'A popular West African rice dish with tomatoes and spices'
    },
    'plantain': {
        'calories': 122, 'protein': 1.3, 'fat': 0.4, 'carbs': 32.0, 'fiber': 2.3, 'sodium': 4,
        'description': 'A starchy fruit similar to banana, rich in potassium and vitamin C'
    },
    'yam': {
        'calories': 118, 'protein': 1.5, 'fat': 0.2, 'carbs': 28.0, 'fiber': 4.1, 'sodium': 9,
        'description': 'A root vegetable high in carbohydrates and fiber'
    }
}


@tool
async def fast_nutrition_lookup(food_name: str) -> Dict[str, Any]:
    """
    Fast nutrition lookup using cached data for instant responses.
    
    Args:
        food_name: Name of the food item to look up
        
    Returns:
        Dict containing nutritional information
    """
    try:
        food_key = food_name.lower().strip()
        
        # Check exact match first
        if food_key in NUTRITION_CACHE:
            nutrition = NUTRITION_CACHE[food_key]
            return _format_nutrition_response(food_name, nutrition, 'USDA Database (Cached)')
        
        # Check regional foods
        if food_key in REGIONAL_FOODS:
            nutrition = REGIONAL_FOODS[food_key]
            description = nutrition.pop('description', '')
            return _format_nutrition_response(food_name, nutrition, 'Nutritional Database', description)
        
        # Check partial matches
        for cached_food, nutrition in NUTRITION_CACHE.items():
            if cached_food in food_key or food_key in cached_food:
                return _format_nutrition_response(food_name, nutrition, f'USDA Database (Similar to {cached_food})')
        
        # Generate category-based nutrition
        return _generate_category_nutrition(food_name)
        
    except Exception as e:
        logger.error(f"Error in fast nutrition lookup: {str(e)}")
        return _generate_category_nutrition(food_name)


def _format_nutrition_response(food_name: str, nutrition: Dict[str, Any], source: str, description: str = "") -> Dict[str, Any]:
    """Format nutrition data into a readable response."""
    
    nutrition_text = f"Nutritional information for {food_name} (per 100g):\n"
    
    if description:
        nutrition_text += f"{description}\n\n"
    
    nutrition_text += f"• Calories: {nutrition.get('calories', 'N/A')}\n"
    nutrition_text += f"• Protein: {nutrition.get('protein', 'N/A')}g\n"
    nutrition_text += f"• Fat: {nutrition.get('fat', 'N/A')}g\n"
    nutrition_text += f"• Carbohydrates: {nutrition.get('carbs', 'N/A')}g\n"
    
    if nutrition.get('fiber'):
        nutrition_text += f"• Fiber: {nutrition['fiber']}g\n"
    if nutrition.get('sodium'):
        nutrition_text += f"• Sodium: {nutrition['sodium']}mg\n"
    
    return {
        'food_name': food_name,
        'nutritional_info': nutrition_text.strip(),
        'raw_nutrients': nutrition,
        'source': source,
        'success': True
    }


def _generate_category_nutrition(food_name: str) -> Dict[str, Any]:
    """Generate nutrition info based on food category."""
    
    food_lower = food_name.lower()
    
    if any(grain in food_lower for grain in ['rice', 'bread', 'pasta', 'wheat', 'oats', 'quinoa', 'cereal']):
        nutrition = {'calories': 150, 'protein': 4.0, 'fat': 1.0, 'carbs': 30.0, 'fiber': 2.0, 'sodium': 5}
        info = f"{food_name} is a carbohydrate-rich food that provides energy and B vitamins."
        
    elif any(protein in food_lower for protein in ['chicken', 'beef', 'fish', 'turkey', 'pork', 'meat']):
        nutrition = {'calories': 200, 'protein': 25.0, 'fat': 10.0, 'carbs': 0, 'fiber': 0, 'sodium': 70}
        info = f"{food_name} is an excellent source of complete protein and essential amino acids."
        
    elif any(legume in food_lower for legume in ['beans', 'lentils', 'chickpeas', 'peas']):
        nutrition = {'calories': 130, 'protein': 9.0, 'fat': 0.5, 'carbs': 23.0, 'fiber': 7.0, 'sodium': 2}
        info = f"{food_name} is a great plant-based protein source that's also high in fiber."
        
    elif any(veg in food_lower for veg in ['vegetable', 'broccoli', 'spinach', 'carrot', 'tomato', 'lettuce']):
        nutrition = {'calories': 25, 'protein': 2.0, 'fat': 0.2, 'carbs': 5.0, 'fiber': 2.0, 'sodium': 20}
        info = f"{food_name} is nutrient-dense and low in calories, rich in vitamins and minerals."
        
    elif any(fruit in food_lower for fruit in ['apple', 'banana', 'orange', 'berry', 'fruit']):
        nutrition = {'calories': 60, 'protein': 0.5, 'fat': 0.2, 'carbs': 15.0, 'fiber': 2.5, 'sodium': 1}
        info = f"{food_name} provides natural sugars, vitamins, and antioxidants."
        
    else:
        nutrition = {'calories': 100, 'protein': 3.0, 'fat': 2.0, 'carbs': 15.0, 'fiber': 2.0, 'sodium': 50}
        info = f"While I don't have specific data for {food_name}, it likely provides a mix of nutrients."
    
    return _format_nutrition_response(food_name, nutrition, 'Estimated Nutritional Profile', info)


# Synchronous wrapper for compatibility
def fast_nutrition_lookup_sync(food_name: str) -> Dict[str, Any]:
    """Synchronous wrapper for fast_nutrition_lookup tool."""
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(fast_nutrition_lookup(food_name))