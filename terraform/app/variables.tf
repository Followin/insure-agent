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

variable "image_tag" {
  description = "Image tag to deploy"
  type        = string
  default     = "latest"
}

variable "dockerhub_token" {
  description = "Docker Hub access token for pulling images"
  type        = string
  sensitive   = true
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 80
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instance access"
  type        = string
  default     = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAEAvrWhKVNyDxWHyLV6WAW7wu0wK/C8TJLxcgTI9d7+ main@nixos"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for custom domain"
  type        = string
  default     = "Z04379903GX9AARXIW31U"
}

variable "domain_name" {
  description = "Custom domain name for the frontend"
  type        = string
  default     = "insure-agent.online"
}

variable "api_domain_name" {
  description = "Custom domain name for the backend API"
  type        = string
  default     = "api.insure-agent.online"
}

variable "certbot_email" {
  description = "Email for Let's Encrypt certificate registration"
  type        = string
  default     = "dlike.version10@gmail.com"
}

variable "db_host" {
  description = "PostgreSQL database host"
  type        = string
  default     = "aws-1-eu-central-1.pooler.supabase.com"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "postgres"
}

variable "db_username" {
  description = "PostgreSQL username"
  type        = string
  default     = "postgres.pvvfiixfywmfpcpvagho"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = "478157598310-nrk0pgl96usfpfmvkq16sbtj8f1hjpk6.apps.googleusercontent.com"
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project   = "insure-agent"
    ManagedBy = "terraform"
  }
}
