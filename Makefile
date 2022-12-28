COMPOSE = docker compose -f ./docker-compose.yml
API_CONTAINER_NAME = morpheus_connection
APP_DOCKERFILE = ./Dockerfile


.PHONY: up
up:
		$(COMPOSE) up -d

.PHONY: stop
stop:
		$(COMPOSE) stop

.PHONY: restart
restart:
		$(COMPOSE) restrt

.PHONY: down
down:
		$(COMPOSE) down

.PHONY: log
log:
		docker logs $(API_CONTAINER_NAME) -f

.PHONY: build
build:
		docker build -t dcq-connecting-morpheus_app -f $(APP_DOCKERFILE) .