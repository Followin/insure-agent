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
    key          = "app/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  front_image = "dlike/insure-agent-front:${var.image_tag}"
  back_image  = "dlike/insure-agent-back:${var.image_tag}"
}

# =============================================================================
# EC2 Instance
# =============================================================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Allow HTTP, HTTPS, and SSH inbound"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-key"
  public_key = var.ssh_public_key

  tags = var.tags
}

resource "aws_instance" "main" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  subnet_id              = tolist(data.aws_subnets.default.ids)[0]

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    dockerhub_token      = var.dockerhub_token
    front_image          = local.front_image
    back_image           = local.back_image
    email                = var.certbot_email
    domain               = var.domain_name
    api_domain           = var.api_domain_name
    database_url         = "postgres://${var.db_username}:${var.db_password}@${var.db_host}:5432/${var.db_name}"
    google_client_id     = var.google_client_id
    google_client_secret = var.google_client_secret

    nginx_conf = templatefile("${path.module}/files/nginx-apps.conf.tpl", {
      domain     = var.domain_name
      api_domain = var.api_domain_name
    })

    certbot_renew_service = file("${path.module}/files/certbot-renew.service")
    certbot_renew_timer   = file("${path.module}/files/certbot-renew.timer")

    docker_auto_update_script = templatefile("${path.module}/files/docker-auto-update.sh.tpl", {
      dockerhub_token      = var.dockerhub_token
      front_image          = local.front_image
      back_image           = local.back_image
      database_url         = "postgres://${var.db_username}:${var.db_password}@${var.db_host}:5432/${var.db_name}"
      google_client_id     = var.google_client_id
      google_client_secret = var.google_client_secret
    })

    docker_auto_update_service = file("${path.module}/files/docker-auto-update.service")
    docker_auto_update_timer   = file("${path.module}/files/docker-auto-update.timer")
  }))

  tags = merge(var.tags, {
    Name = var.project_name
  })
}

resource "aws_eip" "main" {
  instance = aws_instance.main.id
  domain   = "vpc"

  tags = var.tags
}

# =============================================================================
# DNS Configuration
# =============================================================================

resource "aws_route53_record" "front" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.main.public_ip]
}

resource "aws_route53_record" "api" {
  zone_id = var.hosted_zone_id
  name    = var.api_domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.main.public_ip]
}

