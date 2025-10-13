# Makefile pour simplifier les commandes Docker

.PHONY: help build up down restart logs clean

help: ## Affiche cette aide
	@echo "Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

build: ## Construit l'image Docker
	./docker-compose.sh build

up: ## Démarre les services
	./docker-compose.sh up -d

down: ## Arrête les services
	./docker-compose.sh down

restart: ## Redémarre les services
	./docker-compose.sh restart

logs: ## Affiche les logs
	./docker-compose.sh logs -f

clean: ## Nettoie les conteneurs et images
	./docker-compose.sh down --rmi all --volumes --remove-orphans

dev: ## Démarre en mode développement
	./docker-compose.sh up

test: ## Lance les tests
	npm test

init-db: ## Initialise la base de données
	node init_api_key.js