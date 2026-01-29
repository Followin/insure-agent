output "ec2_instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_public_ip" {
  description = "The Elastic IP address of the EC2 instance"
  value       = aws_eip.main.public_ip
}

output "ec2_public_dns" {
  description = "The public DNS name of the EC2 instance"
  value       = aws_instance.main.public_dns
}

output "rds_endpoint" {
  description = "The RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_db_name" {
  description = "The database name"
  value       = aws_db_instance.postgres.db_name
}
