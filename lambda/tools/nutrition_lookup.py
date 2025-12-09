"""
Tool for fetching nutritional information using USDA FoodData Central API.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from strands import tool

logger = logging.getLogger(__name__)


@tool
async def nutrition_lookup(food_name: str, ingredients: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Get nutritional information using USDA FoodData Central API.
    
    Args:
        food_name: Name of the food item to look up
        ingredients: Optional list of ingredients to include in search
        
    Returns:
        Dict containing nutritional information and disclaimers
    """
    try:
        usda_api_key = os.environ.get('USDA_API_KEY')
        
        if not usda_api_key:
            logger.warning("USDA_API_KEY not configured, returning generic response")
            return {
                'food_name': food_name,
                'nutritional_info': 'Nutritional information not available at this time.',
                'disclaimer': 'Please consult nutrition labels or healthcare providers for accurate nutritional information.',
                'source': 'unavailable'
            }
        
        # Prepare search query
        search_query = food_name
        if ingredients:
            # Include main ingredients in search for better results
            search_query = f"{food_name} {' '.join(ingredients[:3])}"  # Limit to first 3 ingredients
        
        # USDA FoodData Central API endpoint
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        
        params = {
            'query': search_query,
            'api_key': usda_api_key,
            'pageSize': 3,  # Get top 3 results
            'dataType': ['Foundation', 'SR Legacy'],  # Focus on reliable data sources
            'sortBy': 'dataType.keyword',
            'sortOrder': 'asc'
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                foods = data.get('foods', [])
                
                if not foods:
                    return {
                        'food_name': food_name,
                        'nutritional_info': f'No specific nutritional data found for "{food_name}". This may be a prepared dish with multiple ingredients.',
                        'disclaimer': 'Nutritional content can vary significantly based on preparation method and ingredients. Consult with restaurant staff for specific dietary information.',
                        'source': 'USDA FoodData Central (no results)'
                    }
                
                # Process the best match (first result)
                best_match = foods[0]
                food_nutrients = best_match.get('foodNutrients', [])
                
                # Extract key nutrients
                nutrients = {}
                nutrient_map = {
                    'Energy': 'calories',
                    'Protein': 'protein',
                    'Total lipid (fat)': 'fat',
                    'Carbohydrate, by difference': 'carbohydrates',
                    'Fiber, total dietary': 'fiber',
                    'Sugars, total including NLEA': 'sugars',
                    'Sodium, Na': 'sodium',
                    'Calcium, Ca': 'calcium',
                    'Iron, Fe': 'iron'
                }
                
                for nutrient in food_nutrients:
                    nutrient_name = nutrient.get('nutrientName', '')
                    nutrient_value = nutrient.get('value', 0)
                    nutrient_unit = nutrient.get('unitName', '')
                    
                    for usda_name, simple_name in nutrient_map.items():
                        if usda_name.lower() in nutrient_name.lower():
                            nutrients[simple_name] = {
                                'value': nutrient_value,
                                'unit': nutrient_unit
                            }
                            break
                
                # Format nutritional information
                nutrition_text = f"Nutritional information for {best_match.get('description', food_name)} (per 100g):\n"
                
                if 'calories' in nutrients:
                    nutrition_text += f"• Calories: {nutrients['calories']['value']:.0f} {nutrients['calories']['unit']}\n"
                if 'protein' in nutrients:
                    nutrition_text += f"• Protein: {nutrients['protein']['value']:.1f}g\n"
                if 'fat' in nutrients:
                    nutrition_text += f"• Fat: {nutrients['fat']['value']:.1f}g\n"
                if 'carbohydrates' in nutrients:
                    nutrition_text += f"• Carbohydrates: {nutrients['carbohydrates']['value']:.1f}g\n"
                if 'fiber' in nutrients:
                    nutrition_text += f"• Fiber: {nutrients['fiber']['value']:.1f}g\n"
                if 'sodium' in nutrients:
                    nutrition_text += f"• Sodium: {nutrients['sodium']['value']:.0f}mg\n"
                
                return {
                    'food_name': food_name,
                    'matched_food': best_match.get('description', ''),
                    'nutritional_info': nutrition_text.strip(),
                    'raw_nutrients': nutrients,
                    'disclaimer': 'Nutritional values are approximate and based on USDA data. Actual values may vary based on preparation methods, portion sizes, and specific ingredients used.',
                    'source': 'USDA FoodData Central'
                }
            else:
                logger.error(f"USDA API request failed with status {response.status_code}")
                return {
                    'food_name': food_name,
                    'nutritional_info': 'Unable to retrieve nutritional information at this time.',
                    'disclaimer': 'Please consult nutrition labels or healthcare providers for accurate nutritional information.',
                    'source': f'USDA API error ({response.status_code})'
                }
                
    except httpx.TimeoutException:
        logger.error(f"Timeout looking up nutrition for {food_name}")
        return {
            'food_name': food_name,
            'nutritional_info': 'Nutritional lookup timed out. Please try again later.',
            'disclaimer': 'Please consult nutrition labels or healthcare providers for accurate nutritional information.',
            'source': 'timeout'
        }
    except Exception as e:
        logger.error(f"Error looking up nutrition: {str(e)}")
        return {
            'food_name': food_name,
            'nutritional_info': 'Unable to retrieve nutritional information due to technical issues.',
            'disclaimer': 'Please consult nutrition labels or healthcare providers for accurate nutritional information.',
            'source': f'error: {str(e)}'
        }


# Synchronous wrapper for compatibility
def nutrition_lookup_sync(food_name: str, ingredients: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Synchronous wrapper for nutrition_lookup tool.
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(nutrition_lookup(food_name, ingredients))