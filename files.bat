@echo off

REM Убедиться, что мы находимся в папке src
cd src

REM --- game module ---
mkdir game\dto
mkdir game\entities
type nul > game\game.gateway.ts
type nul > game\game.service.ts
type nul > game\game.module.ts

REM --- redis module ---
mkdir redis
type nul > redis\redis.service.ts
type nul > redis\redis.module.ts

REM --- common utilities ---
mkdir common\types
mkdir common\utils

REM Вернуться в корень проекта (backend/)
cd ..

REM --- Root files ---
type nul > Dockerfile
type nul > .dockerignore
type nul > package.json
type nul > tsconfig.json

REM Скрипт завершен без лишнего вывода