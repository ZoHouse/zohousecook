#!/bin/bash
# Helper script to get app-specific secret ARN
APP=$1
ENV=$2
REGION="ap-south-1"
PROJECT_NAME="mono-front"

SECRET_NAME="${PROJECT_NAME}-${APP}-${ENV}-secrets"
aws secretsmanager describe-secret \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    --query ARN \
    --output text
