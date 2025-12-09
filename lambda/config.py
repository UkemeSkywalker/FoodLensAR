"""
Configuration and constants for Food Lens Strands Agent Lambda function.
"""

import os
from typing import Dict, Any

# Environment variable names
ENV_VARS = {
    'FOOD_LENS_API_ENDPOINT': 'FOOD_LENS_API_ENDPOINT',
    'FOOD_LENS_API_KEY': 'FOOD_LENS_API_KEY',
    'USDA_API_KEY': 'USDA_API_KEY',
    'AWS_REGION': 'AWS_REGION',
}

# Default configuration values
DEFAULT_CONFIG = {
    'timeout': 30,  # Lambda timeout in seconds
    'memory_size': 512,  # Lambda memory in MB
    'architecture': 'arm64',  # ARM64 for cost optimization
    'runtime': 'python3.12',
    'log_level': 'INFO'
}

# API endpoints
USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Tool configuration
TOOL_CONFIG = {
    'get_dish_info': {
        'timeout': 10.0,
        'max_retries': 2
    },
    'nutrition_lookup': {
        'timeout': 10.0,
        'max_results': 3,
        'data_types': ['Foundation', 'SR Legacy']
    },
    'dietary_advice': {
        'include_disclaimers': True,
        'health_keywords': [
            'allergy', 'allergic', 'diabetes', 'diabetic', 'blood pressure',
            'hypertension', 'cholesterol', 'heart', 'kidney', 'liver',
            'medication', 'pregnant', 'pregnancy', 'breastfeeding',
            'celiac', 'gluten', 'lactose', 'intolerant', 'sensitivity',
            'weight loss', 'diet', 'keto', 'low carb', 'low sodium', 'low fat'
        ]
    }
}


def get_config() -> Dict[str, Any]:
    """
    Get configuration from environment variables with defaults.
    
    Returns:
        Dict containing configuration values
    """
    config = DEFAULT_CONFIG.copy()
    
    # Override with environment variables if present
    for key, env_var in ENV_VARS.items():
        value = os.environ.get(env_var)
        if value:
            config[key.lower()] = value
    
    return config


def validate_environment() -> Dict[str, str]:
    """
    Validate required environment variables.
    
    Returns:
        Dict containing validation results
    """
    missing_vars = []
    warnings = []
    
    # Check required variables
    required_vars = ['FOOD_LENS_API_ENDPOINT']
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    # Check optional but recommended variables
    optional_vars = ['USDA_API_KEY', 'FOOD_LENS_API_KEY']
    for var in optional_vars:
        if not os.environ.get(var):
            warnings.append(f"{var} not set - some functionality may be limited")
    
    return {
        'missing_required': missing_vars,
        'warnings': warnings,
        'valid': len(missing_vars) == 0
    }