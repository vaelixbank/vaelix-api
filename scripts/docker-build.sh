#!/bin/bash

# ============================================
# Vaelix Bank API - Docker Build Script
# ============================================
# Build and publish Docker images for multiple platforms
# ============================================

set -e

# Configuration
IMAGE_NAME="vaelixbank/vaelix-api"
GHCR_IMAGE="ghcr.io/vaelixbank/vaelix-api"
DOCKERHUB_IMAGE="docker.io/vaelixbank/vaelix-api"
PLATFORMS="linux/amd64,linux/arm64"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose not found. Some features may not work."
    fi

    log_success "Dependencies check passed"
}

# Build Docker image
build_image() {
    local tag=${1:-latest}
    local target=${2:-production}

    log_info "Building Docker image: $IMAGE_NAME:$tag (target: $target)"

    if [ "$MULTI_PLATFORM" = true ]; then
        log_info "Building for multiple platforms: $PLATFORMS"
        docker buildx build \
            --platform $PLATFORMS \
            --target $target \
            --tag $IMAGE_NAME:$tag \
            --load \
            .
    else
        docker build \
            --target $target \
            --tag $IMAGE_NAME:$tag \
            .
    fi

    log_success "Image built successfully: $IMAGE_NAME:$tag"
}

# Test Docker image
test_image() {
    local tag=${1:-latest}

    log_info "Testing Docker image: $IMAGE_NAME:$tag"

    # Run container in background
    local container_id
    container_id=$(docker run -d -p 3000:3000 $IMAGE_NAME:$tag)

    # Wait for container to start
    sleep 10

    # Test health endpoint
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        docker logs $container_id
        docker stop $container_id
        docker rm $container_id
        exit 1
    fi

    # Clean up
    docker stop $container_id
    docker rm $container_id

    log_success "Image test passed"
}

# Push to registries
push_image() {
    local tag=${1:-latest}

    if [ "$PUSH_GHCR" = true ]; then
        log_info "Pushing to GitHub Container Registry: $GHCR_IMAGE:$tag"
        docker tag $IMAGE_NAME:$tag $GHCR_IMAGE:$tag
        docker push $GHCR_IMAGE:$tag
        log_success "Pushed to GHCR: $GHCR_IMAGE:$tag"
    fi

    if [ "$PUSH_DOCKERHUB" = true ]; then
        log_info "Pushing to Docker Hub: $DOCKERHUB_IMAGE:$tag"
        docker tag $IMAGE_NAME:$tag $DOCKERHUB_IMAGE:$tag
        docker push $DOCKERHUB_IMAGE:$tag
        log_success "Pushed to Docker Hub: $DOCKERHUB_IMAGE:$tag"
    fi
}

# Build multi-platform and push
build_and_push_multi() {
    local tag=${1:-latest}

    log_info "Building and pushing multi-platform image: $tag"

    # Build and push to GHCR
    if [ "$PUSH_GHCR" = true ]; then
        log_info "Building for GHCR: $PLATFORMS"
        docker buildx build \
            --platform $PLATFORMS \
            --tag $GHCR_IMAGE:$tag \
            --push \
            .
        log_success "Multi-platform image pushed to GHCR: $GHCR_IMAGE:$tag"
    fi

    # Build and push to Docker Hub
    if [ "$PUSH_DOCKERHUB" = true ]; then
        log_info "Building for Docker Hub: $PLATFORMS"
        docker buildx build \
            --platform $PLATFORMS \
            --tag $DOCKERHUB_IMAGE:$tag \
            --push \
            .
        log_success "Multi-platform image pushed to Docker Hub: $DOCKERHUB_IMAGE:$tag"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Build and publish Vaelix Bank API Docker images"
    echo ""
    echo "Options:"
    echo "  -t, --tag TAG       Docker image tag (default: latest)"
    echo "  -m, --multi         Build for multiple platforms"
    echo "  --push-ghcr         Push to GitHub Container Registry"
    echo "  --push-dockerhub    Push to Docker Hub"
    echo "  --test              Test the built image"
    echo "  --dev               Build development image"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Build local image"
    echo "  $0 --test                   # Build and test"
    echo "  $0 --multi --push-ghcr      # Build multi-platform and push to GHCR"
    echo "  $0 --dev                    # Build development image"
}

# Parse command line arguments
MULTI_PLATFORM=false
PUSH_GHCR=false
PUSH_DOCKERHUB=false
TEST_IMAGE=false
BUILD_DEV=false
TAG="latest"

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -m|--multi)
            MULTI_PLATFORM=true
            shift
            ;;
        --push-ghcr)
            PUSH_GHCR=true
            shift
            ;;
        --push-dockerhub)
            PUSH_DOCKERHUB=true
            shift
            ;;
        --test)
            TEST_IMAGE=true
            shift
            ;;
        --dev)
            BUILD_DEV=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting Vaelix Bank API Docker build process"
    log_info "Tag: $TAG, Multi-platform: $MULTI_PLATFORM"

    check_dependencies

    if [ "$BUILD_DEV" = true ]; then
        build_image "$TAG" "development"
    else
        if [ "$MULTI_PLATFORM" = true ]; then
            build_and_push_multi "$TAG"
        else
            build_image "$TAG" "production"

            if [ "$TEST_IMAGE" = true ]; then
                test_image "$TAG"
            fi

            if [ "$PUSH_GHCR" = true ] || [ "$PUSH_DOCKERHUB" = true ]; then
                push_image "$TAG"
            fi
        fi
    fi

    log_success "Docker build process completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    if [ "$PUSH_GHCR" = true ]; then
        echo "  - GHCR: docker pull $GHCR_IMAGE:$TAG"
    fi
    if [ "$PUSH_DOCKERHUB" = true ]; then
        echo "  - Docker Hub: docker pull $DOCKERHUB_IMAGE:$TAG"
    fi
    echo "  - Run: docker run -p 3000:3000 $IMAGE_NAME:$TAG"
}

# Run main function
main "$@"