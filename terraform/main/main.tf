# AWS Elastic Container Registry (ECR) in eu-central-1

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "insure-agent-terraform-state"
    key            = "terraform.tfstate"
    region         = "eu-central-1"
    encrypt        = true
    use_lockfile   = true
  }
}

provider "aws" {
  region = var.aws_region
}

# ECR Repository
resource "aws_ecr_repository" "main" {
  name                 = var.repository_name
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = var.encryption_type
    kms_key         = var.kms_key_arn
  }

  tags = var.tags
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "main" {
  count      = var.enable_lifecycle_policy ? 1 : 0
  repository = aws_ecr_repository.main.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = var.max_image_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ECR Repository Policy (optional - for cross-account access)
resource "aws_ecr_repository_policy" "main" {
  count      = var.repository_policy != null ? 1 : 0
  repository = aws_ecr_repository.main.name
  policy     = var.repository_policy
}

# IAM User for CI/CD ECR access
resource "aws_iam_user" "ci_ecr" {
  name = var.ci_user_name
  tags = var.tags
}

# IAM Policy for ECR push/pull access
resource "aws_iam_policy" "ci_ecr" {
  name        = "${var.ci_user_name}-ecr-policy"
  description = "Policy for CI/CD to push and pull images from ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRGetAuthorizationToken"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECRPushPull"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]
        Resource = aws_ecr_repository.main.arn
      }
    ]
  })

  tags = var.tags
}

# Attach the policy to the CI user
resource "aws_iam_user_policy_attachment" "ci_ecr" {
  user       = aws_iam_user.ci_ecr.name
  policy_arn = aws_iam_policy.ci_ecr.arn
}

# Access key for CI user
resource "aws_iam_access_key" "ci_ecr" {
  user = aws_iam_user.ci_ecr.name
}

# =============================================================================
# App Runner Service
# =============================================================================

# IAM Role for App Runner to access ECR
resource "aws_iam_role" "apprunner_ecr" {
  name = "${var.repository_name}-apprunner-ecr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner_ecr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# App Runner Service
resource "aws_apprunner_service" "main" {
  service_name = var.repository_name

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.main.repository_url}:${var.image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = var.container_port
      }
    }

    auto_deployments_enabled = var.auto_deploy
  }

  instance_configuration {
    cpu    = var.apprunner_cpu
    memory = var.apprunner_memory
  }

  tags = var.tags
}
