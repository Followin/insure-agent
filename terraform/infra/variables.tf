variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "insure-agent"
}

variable "ecr_image_names" {
  description = "List of Docker image names to create ECR repositories for"
  type        = list(string)
  default     = ["front", "back"]
}

variable "image_tag_mutability" {
  description = "The tag mutability setting for the repository (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be either MUTABLE or IMMUTABLE"
  }
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "encryption_type" {
  description = "Encryption type (AES256 or KMS)"
  type        = string
  default     = "AES256"

  validation {
    condition     = contains(["AES256", "KMS"], var.encryption_type)
    error_message = "encryption_type must be either AES256 or KMS"
  }
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption (required if encryption_type is KMS)"
  type        = string
  default     = null
}

variable "enable_lifecycle_policy" {
  description = "Enable lifecycle policy to clean up old images"
  type        = bool
  default     = true
}

variable "max_image_count" {
  description = "Maximum number of images to keep in the repository"
  type        = number
  default     = 5
}

variable "repository_policy" {
  description = "JSON policy document for the ECR repository (for cross-account access)"
  type        = string
  default     = null
}

variable "ci_user_name" {
  description = "Name of the IAM user for CI/CD ECR access"
  type        = string
  default     = "insure-agent-ci"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project   = "insure-agent"
    ManagedBy = "terraform"
  }
}
