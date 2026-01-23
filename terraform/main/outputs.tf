output "repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.main.repository_url
}

output "repository_arn" {
  description = "The ARN of the ECR repository"
  value       = aws_ecr_repository.main.arn
}

output "repository_name" {
  description = "The name of the ECR repository"
  value       = aws_ecr_repository.main.name
}

output "registry_id" {
  description = "The registry ID where the repository was created"
  value       = aws_ecr_repository.main.registry_id
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

# App Runner outputs
output "apprunner_service_url" {
  description = "The URL of the App Runner service"
  value       = aws_apprunner_service.main.service_url
}

output "apprunner_service_arn" {
  description = "The ARN of the App Runner service"
  value       = aws_apprunner_service.main.arn
}

output "apprunner_service_id" {
  description = "The ID of the App Runner service"
  value       = aws_apprunner_service.main.service_id
}
