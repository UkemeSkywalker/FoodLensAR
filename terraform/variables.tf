variable "bucket_name" {
  description = "Name of the S3 bucket for food images"
  type        = string
  default     = "food-lens-image-gen"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "allowed_origins" {
  description = "Allowed origins for CORS configuration"
  type        = list(string)
  default = [
    "http://localhost:3000",
    "https://localhost:3000"
  ]
}
