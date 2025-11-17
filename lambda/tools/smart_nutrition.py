"""
Smart nutrition lookup with fast cache + API fallback for comprehensive coverage.
"""

import os
import json
import logging
import asyncio
from typing import Dict, Any, Optional, List
import httpx
from strands import tool

logger = logging.getLogger(__name__)

# Fast cache for common foods (per 100g) - same as before but smaller
NUTRITION_CACHE = {
    'pizza': {'calories': 266, 'protein': 11.0, 'fat': 10.4, 'carbs': 33.0, 'fiber': 2.3, 'sodium': 598},
    'chicken': {'calories': 165, 'protein': 31.0, 'fat': 3.6, 'carbs': 0, 'fiber': 0, 'sodium': 74},
    'rice': {'calories': 130, 'protein': 2.7, 'fat': 0.3, 'carbs': 28.0, 'fiber': 0.4, 'sodium': 1},
    'beans': {'calories': 127, 'protein': 8.7, 'fat': 0.5, 'carbs': 23.0, 'fiber': 6.4, 'sodium': 2},
    'black beans': {'calories': 132, 'protein': 8.9, 'fat': 0.5, 'carbs': 24.0, 'fiber': 8.7, 'sodium': 2},
    'bread': {'calories': 265, 'protein': 9.0, 'fat': 3.2, 'carbs': 49.0, 'fiber': 2.7, 'sodium': 491},
    'beef': {'calories': 250, 'protein': 26.0, 'fat': 15.0, 'carbs': 0, 'fiber': 0, 'sodium': 72},
    'fish': {'calories': 206, 'protein': 22.0, 'fat': 12.0, 'carbs': 0, 'fiber': 0, 'sodium': 59},
    'egg': {'calories': 155, 'protein': 13.0, 'fat': 11.0, 'carbs': 1.1, 'fiber': 0, 'sodium': 124},
    'milk': {'calories': 42, 'protein': 3.4, 'fat': 1.0, 'carbs': 5.0, 'fiber': 0, 'sodium': 44},
}

# Regional/cultural foods with basic info
REGIONAL_FOODS = {
    'amala': {'calories': 118, 'protein': 1.2, 'fat': 0.2, 'carbs': 27.0, 'fiber': 3.5, 'sodium': 5,
              'description': 'Nigerian staple made from yam flour, rich in carbohydrates and fiber'},
    'fufu': {'calories': 267, 'protein': 1.9, 'fat': 0.2, 'carbs': 65.0, 'fiber': 1.4, 'sodium': 15,
             'description': 'West African staple made from cassava, high in carbohydrates'},
    'jollof rice': {'calories': 150, 'protein': 3.5, 'fat': 2.0, 'carbs': 30.0, 'fiber': 1.0, 'sodium': 400,
                    'description': 'Popular West African rice dish with tomatoes and spices'},
    'plantain': {'calories': 122, 'protein': 1.3, 'fat': 0.4, 'carbs': 32.0, 'fiber': 2.3, 'sodium': 4,
                 'description': 'Starchy fruit similar to banana, rich in potassium'},
    'yam': {'calories': 118, 'protein': 1.5, 'fat': 0.2, 'carbs': 28.0, 'fiber': 4.1, 'sodium': 9,
            'description': 'Root vegetable high in carbohydrates and fiber'},
}


@tool
def smart_nutrition_lookup(food_name: str) -> Dict[str, Any]:
    """
    Smart nutrition lookup: fast cache first, then USDA API, then web search.
    
    Args:
        food_name: Name of the food item to look up
        
    Returns:
        Dict containing nutritional information from the best available source
    """
    async def _async_lookup():
        try:
            food_key = food_name.lower().strip()
            
            # Step 1: Check fast cache for instant response
            if food_key in NUTRITION_CACHE:
                nutrition = NUTRITION_CACHE[food_key]
                return _format_nutrition_response(food_name, nutrition, 'USDA Database (Cached)')
            
            # Step 2: Check regional foods
            if food_key in REGIONAL_FOODS:
                nutrition = REGIONAL_FOODS[food_key]
                description = nutrition.pop('description', '')
                return _format_nutrition_response(food_name, nutrition, 'Nutritional Database', description)
            
            # Step 3 & 4: Try both USDA API and web search in parallel for speed
            usda_task = asyncio.create_task(_try_usda_api(food_name, timeout=8.0))
            web_task = asyncio.create_task(_try_web_search(food_name, timeout=6.0))
            
            # Wait for the first successful result or both to complete
            done, pending = await asyncio.wait(
                [usda_task, web_task], 
                return_when=asyncio.FIRST_COMPLETED,
                timeout=10.0  # Overall timeout for both
            )
            
            # Cancel any pending tasks to save resources
            for task in pending:
                task.cancel()
            
            # Check results from completed tasks
            for task in done:
                try:
                    result = await task
                    if result and result.get('success'):
                        return result
                except Exception as e:
                    logger.warning(f"Task failed: {str(e)}")
            
            # If no parallel results, try to get results from any remaining tasks
            for task in pending:
                try:
                    result = await task
                    if result and result.get('success'):
                        return result
                except Exception:
                    pass
            
            # Step 5: Generate intelligent estimate based on food category
            return _generate_smart_estimate(food_name)
            
        except Exception as e:
            logger.error(f"Error in smart nutrition lookup: {str(e)}")
            return _generate_smart_estimate(food_name)
    
    # Run the async function synchronously
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(_async_lookup())


async def _try_usda_api(food_name: str, timeout: float = 8.0) -> Optional[Dict[str, Any]]:
    """Try USDA API with fast timeout."""
    try:
        usda_api_key = os.environ.get('USDA_API_KEY')
        if not usda_api_key:
            return None
        
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            'query': food_name,
            'api_key': usda_api_key,
            'pageSize': 1,
            'dataType': ['Foundation', 'SR Legacy']
        }
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                foods = data.get('foods', [])
                
                if foods:
                    food_data = foods[0]
                    nutrients = _extract_usda_nutrients(food_data)
                    if nutrients:
                        return _format_nutrition_response(food_name, nutrients, 'USDA FoodData Central')
        
        return None
        
    except Exception as e:
        logger.warning(f"USDA API failed: {str(e)}")
        return None


async def _try_web_search(food_name: str, timeout: float = 6.0) -> Optional[Dict[str, Any]]:
    """Try web search with fast timeout."""
    try:
        # Use DuckDuckGo Instant Answer API
        url = "https://api.duckduckgo.com/"
        params = {
            'q': f"{food_name} nutrition facts calories",
            'format': 'json',
            'no_html': '1',
            'skip_disambig': '1'
        }
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract any useful information
                info_sources = [
                    data.get('Abstract', ''),
                    data.get('Answer', ''),
                    data.get('Definition', '')
                ]
                
                combined_info = ' '.join([info for info in info_sources if info]).strip()
                
                if combined_info and len(combined_info) > 20:
                    # Try to extract numbers from the text
                    estimated_nutrition = _extract_nutrition_from_text(combined_info)
                    return {
                        'food_name': food_name,
                        'nutritional_info': f"Based on available information: {combined_info[:200]}...",
                        'raw_nutrients': estimated_nutrition,
                        'source': 'Web Search',
                        'success': True
                    }
        
        return None
        
    except Exception as e:
        logger.warning(f"Web search failed: {str(e)}")
        return None


def _extract_usda_nutrients(food_data: Dict) -> Dict[str, float]:
    """Extract key nutrients from USDA food data."""
    nutrients = {}
    nutrient_map = {
        'Energy': 'calories',
        'Protein': 'protein',
        'Total lipid (fat)': 'fat',
        'Carbohydrate, by difference': 'carbs',
        'Fiber, total dietary': 'fiber',
        'Sodium, Na': 'sodium'
    }
    
    for nutrient in food_data.get('foodNutrients', []):
        nutrient_name = nutrient.get('nutrientName', '')
        nutrient_value = nutrient.get('value', 0)
        
        for usda_name, simple_name in nutrient_map.items():
            if usda_name.lower() in nutrient_name.lower():
                nutrients[simple_name] = nutrient_value
                break
    
    return nutrients


def _extract_nutrition_from_text(text: str) -> Dict[str, float]:
    """Try to extract nutrition numbers from text."""
    import re
    
    nutrition = {}
    
    # Look for calorie patterns
    calorie_match = re.search(r'(\d+)\s*(?:calories|kcal|cal)', text.lower())
    if calorie_match:
        nutrition['calories'] = float(calorie_match.group(1))
    
    # Look for protein patterns
    protein_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:of\s+)?protein', text.lower())
    if protein_match:
        nutrition['protein'] = float(protein_match.group(1))
    
    return nutrition


def _generate_smart_estimate(food_name: str) -> Dict[str, Any]:
    """Generate intelligent nutrition estimate based on food analysis."""
    food_lower = food_name.lower()
    
    # Analyze food name for clues
    if any(grain in food_lower for grain in ['rice', 'bread', 'pasta', 'wheat', 'oats', 'quinoa', 'cereal', 'flour']):
        nutrition = {'calories': 150, 'protein': 4.0, 'fat': 1.0, 'carbs': 30.0, 'fiber': 2.0, 'sodium': 5}
        category = "grain/carbohydrate"
        
    elif any(protein in food_lower for protein in ['chicken', 'beef', 'fish', 'turkey', 'pork', 'meat', 'salmon', 'tuna']):
        nutrition = {'calories': 200, 'protein': 25.0, 'fat': 10.0, 'carbs': 0, 'fiber': 0, 'sodium': 70}
        category = "protein/meat"
        
    elif any(legume in food_lower for legume in ['beans', 'lentils', 'chickpeas', 'peas', 'legume']):
        nutrition = {'calories': 130, 'protein': 9.0, 'fat': 0.5, 'carbs': 23.0, 'fiber': 7.0, 'sodium': 2}
        category = "legume/plant protein"
        
    elif any(veg in food_lower for veg in ['vegetable', 'broccoli', 'spinach', 'carrot', 'tomato', 'lettuce', 'cabbage']):
        nutrition = {'calories': 25, 'protein': 2.0, 'fat': 0.2, 'carbs': 5.0, 'fiber': 2.0, 'sodium': 20}
        category = "vegetable"
        
    elif any(fruit in food_lower for fruit in ['apple', 'banana', 'orange', 'berry', 'fruit', 'mango', 'grape']):
        nutrition = {'calories': 60, 'protein': 0.5, 'fat': 0.2, 'carbs': 15.0, 'fiber': 2.5, 'sodium': 1}
        category = "fruit"
        
    elif any(dairy in food_lower for dairy in ['milk', 'cheese', 'yogurt', 'dairy']):
        nutrition = {'calories': 80, 'protein': 6.0, 'fat': 4.0, 'carbs': 6.0, 'fiber': 0, 'sodium': 100}
        category = "dairy"
        
    else:
        nutrition = {'calories': 100, 'protein': 3.0, 'fat': 2.0, 'carbs': 15.0, 'fiber': 2.0, 'sodium': 50}
        category = "mixed food"
    
    info = f"{food_name} appears to be a {category}. Based on similar foods, here's the estimated nutritional profile per 100g. For specific dietary needs, please verify with restaurant staff or nutrition labels."
    
    return _format_nutrition_response(food_name, nutrition, 'Estimated (Smart Analysis)', info)


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


# Synchronous wrapper for compatibility
def smart_nutrition_lookup_sync(food_name: str) -> Dict[str, Any]:
    """Synchronous wrapper for smart_nutrition_lookup tool."""
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(smart_nutrition_lookup(food_name))