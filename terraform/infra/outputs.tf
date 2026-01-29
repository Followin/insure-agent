output "ecr_repository_urls" {
  description = "Map of image name to ECR repository URL"
  value       = { for name, repo in aws_ecr_repository.images : name => repo.repository_url }
}

output "ecr_repository_arns" {
  description = "Map of image name to ECR repository ARN"
  value       = { for name, repo in aws_ecr_repository.images : name => repo.arn }
}

output "ecr_registry_url" {
  description = "The ECR registry URL (shared across all repositories)"
  value       = split("/", aws_ecr_repository.images[var.ecr_image_names[0]].repository_url)[0]
}

output "ci_user_name" {
  description = "The name of the CI IAM user"
  value       = aws_iam_user.ci_ecr.name
}

output "ci_user_arn" {
  description = "The ARN of the CI IAM user"
  value       = aws_iam_user.ci_ecr.arn
}

output "ci_access_key_id" {
  description = "The access key ID for the CI user"
  value       = aws_iam_access_key.ci_ecr.id
}

output "ci_secret_access_key" {
  description = "The secret access key for the CI user"
  value       = aws_iam_access_key.ci_ecr.secret
  sensitive   = true
}
