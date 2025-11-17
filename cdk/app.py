#!/usr/bin/env python3
"""
AWS CDK app for Food Lens Lambda deployment.
"""

import aws_cdk as cdk
from stacks.lambda_stack import FoodLensLambdaStack

app = cdk.App()

# Get environment configuration
env = cdk.Environment(
    account=app.node.try_get_context("account"),
    region=app.node.try_get_context("region") or "us-east-1"
)

# Deploy Lambda stack
FoodLensLambdaStack(
    app, 
    "FoodLensLambdaStack",
    env=env,
    description="Food Lens Strands Agent Lambda function and related resources"
)

app.synth()