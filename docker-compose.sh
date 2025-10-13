#!/bin/bash

# Wrapper script pour docker-compose sans sudo
# Utilise sudo uniquement pour les commandes Docker

if [ "$1" = "up" ] || [ "$1" = "down" ] || [ "$1" = "build" ] || [ "$1" = "start" ] || [ "$1" = "stop" ]; then
    echo "🔧 Exécution de docker-compose $@ avec sudo..."
    sudo docker-compose "$@"
else
    echo "ℹ️  Commande docker-compose $@ (pas besoin de sudo)"
    docker-compose "$@"
fi