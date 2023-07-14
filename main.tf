terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.4.0"
    }
  }
  required_version = "~> 1.2"
}

provider "aws" {
  region = "us-east-1"
}

data "archive_file" "lambda_rizmic_fits" {
  type = "zip"

  source_dir  = "${path.module}/build/src"
  output_path = "${path.module}/rizmic_fits_server.zip"
}

resource "aws_s3_object" "lambda_rizmic_fits" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "rizmic_fits_server.zip"
  source = data.archive_file.lambda_rizmic_fits.output_path

  etag = filemd5(data.archive_file.lambda_rizmic_fits.output_path)
}

resource "aws_lambda_function" "rizmic_fits" {
  function_name = "server"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_rizmic_fits.key

  runtime = "nodejs16.x"
  handler = "server.handler"

  source_code_hash = data.archive_file.lambda_rizmic_fits.output_base64sha256

  role = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      NODE_ENV = "production"
      PORT=7001
      DB_NAME="rizmic_dev"
      MONGO_USERNAME="julfikar"
      MONGO_PASSWORD="julfikar.com"
      JWT_SECRET="rizmaticfits"
      GOOGLE_CLIENT_ID="458447354145-57rkatnbg1t4b8ocs20a7jrv8t5ca12o.apps.googleusercontent.com"
      GOOGLE_CLIENT_SECRET="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"
      GOOGLE_EMAIL_SENDER="rizmicfits@gmail.com"
      GOOGLE_EMAIL_SENDER_PASSWORD="okdncvwnmvcndsyx"
      GOOGLE_EMAIL_CLIENT_ID="458447354145-6a7k3gma45god161o3s2k3jrai5c8286.apps.googleusercontent.com"
      GOOGLE_EMAIL_CLIENT_SECRET="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"
      GOOGLE_EMAIL_REFRESH_TOKEN="1//045ukz8xsTZT1CgYIARAAGAQSNwF-L9Ir1ocuVpbLN0gROGB-stwY4oP4r4ew__lofdgd2HxYIMyE9BywSimKOfNm_rmd18B5XqE"
      GOOGLE_EMAIL_REDIRECT_URI="https://developers.google.com/oauthplayground"
      CLOUDINARY_NAME="rizmic"
      CLOUDINARY_API_KEY="762738595373856"
      CLOUDINARY_API_SECRET="AUgYagDN5gA9U64bWO-AF170xk4"
      CLOUDINARY_PRESET="pk2jbdwi"
      MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY=100
      MAX_CONSECUTIVE_FAILS_BY_EMAIL_AND_IP=10
      HOTMAIL_EMAIL="rizmicfits@hotmail.com"
      HOTMAIL_PASSWORD="rizmic101!"
      REDIS_HOST=127.0.0.1
      REDIS_PORT=6379
      LOCAL_CLIENT="http://localhost:5173"
      PRODUCTION_CLIENT="http://rizmicfitsclient.s3-website-us-east-1.amazonaws.com"
      ROLLBAR_TOKEN="fd33c0c14321416298b161b7983a0c9c"
    }
  }
}

resource "aws_cloudwatch_log_group" "rizmic_fits" {
  name = "/aws/lambda/${aws_lambda_function.rizmic_fits.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_apigatewayv2_api" "lambda" {
  name          = "serverless_lambda_gw"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "lambda" {
  api_id = aws_apigatewayv2_api.lambda.id

  name        = "serverless_lambda_stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "rizmic_fits" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_uri    = aws_lambda_function.rizmic_fits.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "rizmic_fits" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "GET /"
  target    = "integrations/${aws_apigatewayv2_integration.rizmic_fits.id}"
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_apigatewayv2_api.lambda.name}"

  retention_in_days = 30
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rizmic_fits.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}
