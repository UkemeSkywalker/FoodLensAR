output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.food_images.bucket
}

output "access_key_id" {
  description = "AWS access key ID for the application"
  value       = aws_iam_access_key.food_lens_app_key.id
  sensitive   = true
}

output "secret_access_key" {
  description = "AWS secret access key for the application"
  value       = aws_iam_access_key.food_lens_app_key.secret
  sensitive   = true
}