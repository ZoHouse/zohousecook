#!/bin/bash

# This script generates Docker build arguments from environment variables
# It looks for NEXT_PUBLIC_* variables and formats them as --build-arg

BUILD_ARGS=""

# Get all NEXT_PUBLIC_* environment variables
for var in $(env | grep '^NEXT_PUBLIC_' | cut -d= -f1); do
  value="${!var}"
  BUILD_ARGS="$BUILD_ARGS --build-arg $var=\"$value\""
done

# Output the build args (without newline to be used in commands)
echo "$BUILD_ARGS"

