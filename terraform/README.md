# Food Lens AWS S3 Infrastructure

Simple Terraform configuration for S3 bucket setup.

## Prerequisites

1. Install Terraform
2. Configure AWS credentials:
   ```bash
   aws configure
   ```

## Setup

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with a globally unique bucket name

3. Deploy:
   ```bash
   terraform init
   terraform apply
   ```

## What's Created

- S3 bucket with CORS configuration
- IAM user with S3 read/write/delete permissions
- Access keys for the application

## Get Credentials

After deployment:

```bash
terraform output bucket_name
terraform output access_key_id
terraform output secret_access_key
```

Add to your `.env.local`:

```env
AWS_ACCESS_KEY_ID=output-from-terraform
AWS_SECRET_ACCESS_KEY=output-from-terraform
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=output-from-terraform
```

## Cleanup

```bash
terraform destroy
```