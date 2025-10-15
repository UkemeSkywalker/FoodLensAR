terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# S3 bucket for storing food images
resource "aws_s3_bucket" "food_images" {
  bucket = var.bucket_name
}

# S3 bucket CORS configuration
resource "aws_s3_bucket_cors_configuration" "food_images_cors" {
  bucket = aws_s3_bucket.food_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["http://localhost:3000", "https://localhost:3000"]
    max_age_seconds = 3000
  }
}

# IAM user for application access
resource "aws_iam_user" "food_lens_app" {
  name = "food-lens-app"
}

# IAM policy for S3 bucket access
resource "aws_iam_user_policy" "food_lens_s3_policy" {
  name = "food-lens-s3-access"
  user = aws_iam_user.food_lens_app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.food_images.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.food_images.arn
      }
    ]
  })
}

# Access keys for the IAM user
resource "aws_iam_access_key" "food_lens_app_key" {
  user = aws_iam_user.food_lens_app.name
}
