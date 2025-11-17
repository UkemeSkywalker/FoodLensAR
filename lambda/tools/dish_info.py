"""
Tool for fetching detailed menu item information from Food Lens API.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import httpx
from strands import tool

logger = logging.getLogger(__name__)


@tool
def get_dish_info(dish_id: str, restaurant_id: str) -> Dict[str, Any]:
    """
    Fetch detailed menu item information from Food Lens API.
    
    Args:
        dish_id: UUID of the menu item
        restaurant_id: UUID of the restaurant
        
    Returns:
        Dict containing dish information including name, price, ingredients, description
    """
    try:
        api_endpoint = os.environ.get('FOOD_LENS_API_ENDPOINT')
        
        if not api_endpoint:
            logger.error("FOOD_LENS_API_ENDPOINT not configured")
            return {
                'error': 'API endpoint not configured',
                'dish_id': dish_id,
                'restaurant_id': restaurant_id
            }
        
        # Construct API URL for public menu access
        url = f"{api_endpoint}/api/menu"
        
        # Make API request to get all menu items for the restaurant
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                url,
                params={
                    'restaurantId': restaurant_id,
                    'public': 'true'
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                menu_items = data.get('menuItems', [])
                
                # Find the specific dish by ID
                dish = None
                for item in menu_items:
                    if item.get('id') == dish_id:
                        dish = item
                        break
                
                if dish:
                    logger.info(f"Successfully fetched dish info for {dish_id}")
                    return {
                        'success': True,
                        'dish': dish,
                        'dish_id': dish_id,
                        'restaurant_id': restaurant_id
                    }
                else:
                    return {
                        'error': 'Dish not found in menu',
                        'dish_id': dish_id,
                        'restaurant_id': restaurant_id
                    }
            else:
                logger.error(f"API request failed with status {response.status_code}: {response.text}")
                return {
                    'error': f'API request failed: {response.status_code}',
                    'dish_id': dish_id,
                    'restaurant_id': restaurant_id
                }
                
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching dish info for {dish_id}")
        return {
            'error': 'Request timeout',
            'dish_id': dish_id,
            'restaurant_id': restaurant_id
        }
    except Exception as e:
        logger.error(f"Error fetching dish info: {str(e)}")
        return {
            'error': f'Failed to fetch dish information: {str(e)}',
            'dish_id': dish_id,
            'restaurant_id': restaurant_id
        }


# Synchronous wrapper for compatibility
def get_dish_info_sync(dish_id: str, restaurant_id: str) -> Dict[str, Any]:
    """
    Synchronous wrapper for get_dish_info tool.
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(get_dish_info(dish_id, restaurant_id))