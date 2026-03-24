variable "aws_region" {
  description = "AWS region for LinkGuard"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
  default     = "linkguard"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}
