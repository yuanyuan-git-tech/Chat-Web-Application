package controllers

import (
	"context"
	"database/sql"
	"github.com/go-redis/redis/v8"
)

var db *sql.DB
var redisClient *redis.Client

func SetupController(ctx context.Context) {
	db = ctx.Value("db").(*sql.DB)
	redisClient = ctx.Value("redisClient").(*redis.Client)
}
