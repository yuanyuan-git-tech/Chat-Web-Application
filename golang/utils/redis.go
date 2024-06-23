package utils

import (
	"github.com/go-redis/redis/v8"
	"log"
	"os"
)

func RedisClient() *redis.Client {
	getEnv()

	client := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDR"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	log.Println("Connected to Redis!")
	return client
}
