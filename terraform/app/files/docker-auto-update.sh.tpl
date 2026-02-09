#!/bin/bash
set -euo pipefail

DOCKERHUB_TOKEN="${dockerhub_token}"
FRONT_IMAGE="${front_image}"
BACK_IMAGE="${back_image}"
DATABASE_URL="${database_url}"

# Authenticate with Docker Hub
echo "$DOCKERHUB_TOKEN" | docker login --username dlike --password-stdin >/dev/null 2>&1

update_container() {
  local name="$1"; shift
  local image="$1"; shift
  # remaining args are extra docker run flags

  local running_image_id
  running_image_id=$(docker inspect --format='{{.Image}}' "$name" 2>/dev/null || echo "")

  docker pull "$image" >/dev/null 2>&1

  local pulled_image_id
  pulled_image_id=$(docker image inspect --format='{{.Id}}' "$image" 2>/dev/null || echo "")

  if [ -n "$running_image_id" ] && [ "$running_image_id" = "$pulled_image_id" ]; then
    return 0
  fi

  echo "$(date): Updating $name to latest $image"
  docker stop "$name" 2>/dev/null || true
  docker rm "$name" 2>/dev/null || true
  docker run -d --restart always --name "$name" --network app "$@" "$image"
}

update_container "frontend" "$FRONT_IMAGE" \
  -p 3000:80

update_container "backend" "$BACK_IMAGE" \
  -p 8000:80 \
  -e BIND_ADDRESS=0.0.0.0:80 \
  -e "DATABASE_URL=$DATABASE_URL"
