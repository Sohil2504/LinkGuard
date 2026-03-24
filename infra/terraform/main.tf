locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

output "planned_resources" {
  value = {
    http_api            = "${local.name_prefix}-http-api"
    api_lambda          = "${local.name_prefix}-api"
    dispatcher_lambda   = "${local.name_prefix}-dispatcher"
    worker_lambda       = "${local.name_prefix}-worker"
    check_queue         = "${local.name_prefix}-check-queue"
    check_dlq           = "${local.name_prefix}-check-dlq"
    monitors_table      = "${local.name_prefix}-monitors"
    incidents_table     = "${local.name_prefix}-incidents"
    check_results_table = "${local.name_prefix}-check-results"
  }
}
