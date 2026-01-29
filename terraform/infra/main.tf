terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket       = "insure-agent-terraform-state"
    key          = "infra/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}

# =============================================================================
# ECR Repositories
# =============================================================================

resource "aws_ecr_repository" "images" {
  for_each             = toset(var.ecr_image_names)
  name                 = "${var.project_name}-${each.value}"
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

resource "aws_ecr_lifecycle_policy" "images" {
  for_each   = var.enable_lifecycle_policy ? toset(var.ecr_image_names) : toset([])
  repository = aws_ecr_repository.images[each.value].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.max_image_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_repository_policy" "images" {
  for_each   = var.repository_policy != null ? toset(var.ecr_image_names) : toset([])
  repository = aws_ecr_repository.images[each.value].name
  policy     = var.repository_policy
}

# =============================================================================
# IAM User for CI/CD ECR access
# =============================================================================

resource "aws_iam_user" "ci_ecr" {
  name = var.ci_user_name
  tags = var.tags
}

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
        Resource = [for repo in aws_ecr_repository.images : repo.arn]
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_user_policy_attachment" "ci_ecr" {
  user       = aws_iam_user.ci_ecr.name
  policy_arn = aws_iam_policy.ci_ecr.arn
}

resource "aws_iam_access_key" "ci_ecr" {
  user = aws_iam_user.ci_ecr.name
}
