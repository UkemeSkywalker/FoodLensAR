#!/usr/bin/env python3
"""
Quick test for the smart_nutrition_lookup tool fix.
"""

import json
import os
import sys
import asyncio
from pathlib import Path

# Add current directory to Python path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Set minimal environment variables
os.environ.setdefault('AWS_REGION', 'us-east-1')
os.environ.setdefault('LOG_LEVEL', 'INFO')

async def test_nutrition_tool():
    """Test the smart_nutrition_lookup tool directly."""
    print("Testing smart_nutrition_lookup tool...")
    
    try:
        from tools.smart_nutrition import smart_nutrition_lookup
        
        # Test with a simple food item
        result = await smart_nutrition_lookup("quinoa")
        
        print(f"Result: {json.dumps(result, indent=2)}")
        
        if result.get('success'):
            print("✅ Tool executed successfully")
            return True
        else:
            print("❌ Tool did not return success")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_agent_with_tool():
    """Test the full agent with the nutrition tool."""
    print("\nTesting full agent with nutrition tool...")
    
    try:
        from agent_handler import handler
        
        # Test event
        test_event = {
            'prompt': 'Tell me about quinoa nutrition',
            'context': {
                'restaurantId': 'test-123'
            }
        }
        
        print(f"Test event: {json.dumps(test_event, indent=2)}")
        
        # Call handler
        result = handler(test_event, None)
        
        print(f"Result: {json.dumps(result, indent=2)}")
        
        if result.get('statusCode') == 200:
            body = json.loads(result.get('body', '{}'))
            if 'response' in body and body['response']:
                print("✅ Agent test passed")
                return True
            else:
                print("❌ Response missing or empty")
                return False
        else:
            print(f"❌ Unexpected status code: {result.get('statusCode')}")
            return False
            
    except Exception as e:
        print(f"❌ Agent test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("=" * 50)
    print("Smart Nutrition Tool - Fix Verification")
    print("=" * 50)
    
    # Test 1: Direct tool test
    tool_passed = await test_nutrition_tool()
    
    # Test 2: Full agent test
    agent_passed = await test_agent_with_tool()
    
    print("\n" + "=" * 50)
    if tool_passed and agent_passed:
        print("🎉 All tests passed! The fix works.")
    else:
        print("⚠️  Some tests failed.")
    print("=" * 50)
    
    return tool_passed and agent_passed


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
