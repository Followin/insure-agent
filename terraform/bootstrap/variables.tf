variable "aws_region" {
  description = "AWS region for the state backend resources"
  type        = string
  default     = "eu-central-1"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  type        = string
  default     = "insure-agent-terraform-state"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project   = "insure-agent"
    ManagedBy = "terraform"
    Purpose   = "terraform-state"
  }
}
