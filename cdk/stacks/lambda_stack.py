"""
AWS CDK stack for Food Lens Strands Agent Lambda function.
"""

from aws_cdk import (
    Stack,
    Duration,
    aws_lambda,
    aws_iam,
    aws_logs,
    CfnOutput,
    BundlingOptions
)
from constructs import Construct
import os


class FoodLensLambdaStack(Stack):
    """
    CDK Stack for Food Lens Strands Agent Lambda function.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create Lambda execution role with necessary permissions
        lambda_role = aws_iam.Role(
            self, "FoodLensLambdaRole",
            assumed_by=aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                aws_iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add Bedrock permissions for Strands Agent
        lambda_role.add_to_policy(
            aws_iam.PolicyStatement(
                effect=aws_iam.Effect.ALLOW,
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream",
                    "bedrock:GetFoundationModel",
                    "bedrock:ListFoundationModels"
                ],
                resources=["*"]  # Bedrock models don't have specific ARNs
            )
        )

        # Add CloudWatch Logs permissions
        lambda_role.add_to_policy(
            aws_iam.PolicyStatement(
                effect=aws_iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[f"arn:aws:logs:{self.region}:{self.account}:*"]
            )
        )

        # Create Lambda function with proper cross-platform bundling
        lambda_function = aws_lambda.Function(
            self, "FoodLensStrandsAgent",
            function_name="food-lens-strands-agent",
            runtime=aws_lambda.Runtime.PYTHON_3_12,
            handler="agent_handler.handler",
            code=aws_lambda.Code.from_asset(
                "../lambda",  # Path relative to cdk directory
                bundling=BundlingOptions(
                    image=aws_lambda.Runtime.PYTHON_3_12.bundling_image,
                    command=[
                        "bash", "-c",
                        "pip install -r requirements.txt -t /asset-output --python-version 3.12 --platform manylinux2014_aarch64 --only-binary=:all: && cp -r . /asset-output"
                    ],
                    user="root"
                )
            ),
            role=lambda_role,
            timeout=Duration.seconds(90),  # Increased for AI processing with API calls
            memory_size=1024,  # Increased for Strands SDK
            architecture=aws_lambda.Architecture.ARM_64,
            environment={
                # Environment variables will be set during deployment
                "FOOD_LENS_API_ENDPOINT": self.node.try_get_context("food_lens_api_endpoint") or os.environ.get("FOOD_LENS_API_ENDPOINT", ""),
                "FOOD_LENS_API_KEY": self.node.try_get_context("food_lens_api_key") or os.environ.get("FOOD_LENS_API_KEY", ""),
                "USDA_API_KEY": self.node.try_get_context("usda_api_key") or os.environ.get("USDA_API_KEY", ""),
                "LOG_LEVEL": "INFO"
                # Note: AWS_REGION is automatically provided by Lambda runtime
            },
            description="Food Lens AI Food Advisor using Strands Agents SDK"
        )

        # Create CloudWatch Log Group with retention
        log_group = aws_logs.LogGroup(
            self, "FoodLensLambdaLogGroup",
            log_group_name=f"/aws/lambda/{lambda_function.function_name}",
            retention=aws_logs.RetentionDays.ONE_WEEK
        )

        # Output Lambda function ARN and name
        CfnOutput(
            self, "LambdaFunctionArn",
            value=lambda_function.function_arn,
            description="ARN of the Food Lens Strands Agent Lambda function"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Name of the Food Lens Strands Agent Lambda function"
        )

        # Store function reference for potential cross-stack references
        self.lambda_function = lambda_function