"""
Tool for web search to find information about food items when other sources fail.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import httpx
from strands import tool

logger = logging.getLogger(__name__)


@tool
async def web_search_food_info(food_name: str, query_context: str = "") -> Dict[str, Any]:
    """
    Search the web for information about foods - nutrition, preparation, cultural info, etc.
    
    Args:
        food_name: Name of the food item to search for
        query_context: Additional context for the search (e.g., "nutrition", "recipe", "origin")
        
    Returns:
        Dict containing search results and food information
    """
    try:
        # Build search query based on context
        if query_context:
            search_query = f"{food_name} {query_context}"
        else:
            search_query = f"{food_name} food information nutrition facts"
        
        logger.info(f"Searching for: {search_query}")
        
        # Use DuckDuckGo Instant Answer API (no API key required)
        url = "https://api.duckduckgo.com/"
        params = {
            'q': search_query,
            'format': 'json',
            'no_html': '1',
            'skip_disambig': '1'
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"DuckDuckGo response keys: {list(data.keys())}")
                
                # Extract all available information
                search_info = ""
                
                # Primary sources of information
                if data.get('Answer'):
                    search_info += f"{data['Answer']}\n\n"
                
                if data.get('Abstract'):
                    search_info += f"{data['Abstract']}\n\n"
                
                if data.get('Definition'):
                    search_info += f"Definition: {data['Definition']}\n\n"
                
                # Related topics and results
                if data.get('RelatedTopics'):
                    related_info = []
                    for topic in data['RelatedTopics'][:3]:  # Limit to first 3
                        if isinstance(topic, dict) and topic.get('Text'):
                            related_info.append(topic['Text'])
                    
                    if related_info:
                        search_info += "Additional Information:\n" + "\n".join(f"• {info}" for info in related_info) + "\n\n"
                
                # Infobox data (often contains nutritional info)
                if data.get('Infobox') and data['Infobox'].get('content'):
                    infobox_items = []
                    for item in data['Infobox']['content'][:5]:  # Limit to first 5 items
                        if item.get('label') and item.get('value'):
                            infobox_items.append(f"{item['label']}: {item['value']}")
                    
                    if infobox_items:
                        search_info += "Key Facts:\n" + "\n".join(f"• {item}" for item in infobox_items) + "\n\n"
                
                if search_info.strip():
                    return {
                        'food_name': food_name,
                        'search_results': search_info.strip(),
                        'source': 'DuckDuckGo Search API',
                        'success': True,
                        'query_used': search_query
                    }
        
        # If DuckDuckGo doesn't return useful info, indicate search was attempted but no results
        logger.warning(f"No useful information found for {food_name}")
        return {
            'food_name': food_name,
            'search_results': f"I searched for information about {food_name} but couldn't find specific details in my current search results. This might be a regional food, specialty item, or the search terms need to be more specific.",
            'source': 'Search attempted - no results',
            'success': False,
            'query_used': search_query,
            'suggestion': f"You might want to ask about specific aspects of {food_name} like its nutritional content, preparation method, or cultural significance."
        }
        
    except Exception as e:
        logger.error(f"Error in web search for {food_name}: {str(e)}")
        return {
            'food_name': food_name,
            'search_results': f"I encountered a technical issue while searching for information about {food_name}. Please try asking again or rephrase your question.",
            'source': 'Search error',
            'success': False,
            'error': str(e)
        }


# Synchronous wrapper for compatibility
def web_search_food_info_sync(food_name: str, query_context: str = "") -> Dict[str, Any]:
    """
    Synchronous wrapper for web_search_food_info tool.
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(web_search_food_info(food_name, query_context))