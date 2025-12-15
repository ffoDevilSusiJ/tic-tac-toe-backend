# TIC-TAC-TOE Backend

Бекенд реализация проекта tic-tac-toe

Реализует Websocket сервер и осуществляет обмен событиями между подписчиками.

## Быстрый запуск

```bash
# 1. Клонируем репозиторий

git clone https://github.com/ffoDevilSusiJ/tic-tac-toe-backend.git
cd tic-tac-toe-backend

# 2. Создаем сеть
docker create network tictactoe-network

# 3. Запускаем
docker compose up -d
```

WS API будет доступно на localhost:8080