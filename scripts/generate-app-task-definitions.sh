#!/bin/bash
set -e

# This script generates task definition files for all apps
# Usage: ./scripts/generate-app-task-definitions.sh

APPS=("admin" "comic" "dashboard" "meme" "payment" "pms" "web-checkin" "website" "zo-ops" "ops-backend")
ENVIRONMENTS=("staging" "production")

mkdir -p aws/task-definitions

for APP in "${APPS[@]}"; do
  for ENV in "${ENVIRONMENTS[@]}"; do
    
    # Set resource allocation based on environment
    if [ "$ENV" = "production" ]; then
      CPU="1024"
      MEMORY="2048"
    else
      CPU="512"
      MEMORY="1024"
    fi
    
    # Special case for ops-backend (Node.js)
    if [ "$APP" = "ops-backend" ]; then
      CPU="256"
      MEMORY="512"
    fi
    
    OUTPUT_FILE="aws/task-definitions/${APP}-${ENV}.json"
    
    cat > "$OUTPUT_FILE" <<EOF
{
  "family": "mono-front-${APP}-${ENV}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "${CPU}",
  "memory": "${MEMORY}",
  "executionRoleArn": "arn:aws:iam::670664477975:role/mono-front-ecs-execution-role",
  "taskRoleArn": "arn:aws:iam::670664477975:role/mono-front-ecs-task-role",
  "containerDefinitions": [
    {
      "name": "${APP}",
      "image": "PLACEHOLDER_IMAGE",
      "portMappings": [{ "containerPort": 3000 }],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mono-front-${APP}-${ENV}",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "secrets": []
    }
  ]
}
EOF
    
    echo "✅ Generated: $OUTPUT_FILE"
  done
done

echo "🎉 All task definitions generated!"

