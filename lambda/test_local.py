#!/usr/bin/env python3
"""
Local testing script for Food Lens Strands Agent Lambda function.
"""

import json
import os
import sys
from pathlib import Path

# Add current directory to Python path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Set environment variables for testing
os.environ.setdefault('FOOD_LENS_API_ENDPOINT', 'http://localhost:3000')
os.environ.setdefault('USDA_API_KEY', 'test-key')
os.environ.setdefault('AWS_REGION', 'us-east-1')
os.environ.setdefault('LOG_LEVEL', 'INFO')

def test_basic_functionality():
    """Test basic Lambda function functionality."""
    print("Testing basic Lambda function functionality...")
    
    try:
        # Import after setting environment variables
        from agent_handler import handler
        
        # Test event
        test_event = {
            'prompt': 'Tell me about the nutritional content of pizza',
            'context': {
                'restaurantId': 'test-restaurant-123'
            }
        }
        
        print(f"Test event: {json.dumps(test_event, indent=2)}")
        
        # Call handler
        result = handler(test_event, None)
        
        print(f"Result: {json.dumps(result, indent=2)}")
        
        # Validate response structure
        if result.get('statusCode') == 200:
            body = json.loads(result.get('body', '{}'))
            if 'response' in body:
                print("✅ Basic functionality test passed")
                return True
            else:
                print("❌ Response missing 'response' field")
                return False
        else:
            print(f"❌ Unexpected status code: {result.get('statusCode')}")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure Strands Agents SDK is installed:")
        print("pip install strands-agents")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False


def test_tools_import():
    """Test that all tools can be imported."""
    print("Testing tool imports...")
    
    try:
        from tools.dish_info import get_dish_info
        from tools.nutrition_lookup import nutrition_lookup
        from tools.dietary_advice import dietary_advice
        
        print("✅ All tools imported successfully")
        return True
        
    except ImportError as e:
        print(f"❌ Tool import error: {e}")
        return False


def test_config_validation():
    """Test configuration validation."""
    print("Testing configuration validation...")
    
    try:
        from config import validate_environment, get_config
        
        # Test environment validation
        validation_result = validate_environment()
        print(f"Environment validation: {validation_result}")
        
        # Test config loading
        config = get_config()
        print(f"Config loaded: {len(config)} settings")
        
        print("✅ Configuration validation passed")
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False


def test_error_handling():
    """Test error handling."""
    print("Testing error handling...")
    
    try:
        from agent_handler import handler
        
        # Test with missing prompt
        test_event = {
            'context': {
                'restaurantId': 'test-restaurant-123'
            }
        }
        
        result = handler(test_event, None)
        
        if result.get('statusCode') == 400:
            print("✅ Error handling test passed")
            return True
        else:
            print(f"❌ Expected 400 status code, got: {result.get('statusCode')}")
            return False
            
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 50)
    print("Food Lens Strands Agent - Local Testing")
    print("=" * 50)
    
    tests = [
        ("Tool Imports", test_tools_import),
        ("Configuration", test_config_validation),
        ("Error Handling", test_error_handling),
        ("Basic Functionality", test_basic_functionality),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        if test_func():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Lambda function is ready for deployment.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        
    print("=" * 50)
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)