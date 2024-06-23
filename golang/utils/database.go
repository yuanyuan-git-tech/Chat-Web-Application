package utils

import (
	"database/sql"
	"fmt"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"log"
	"os"
)

func getEnv() {
	var err = godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %s", err)
	}
}

func GetConnection() *sql.DB {
	getEnv()
	host := os.Getenv("HOST")
	port := os.Getenv("PORT")
	db_user := os.Getenv("DB_USER")
	password := os.Getenv("PASSWORD")
	dbname := os.Getenv("DBNAME")

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, db_user, password, dbname)
	fmt.Println("Host:", host, "Port:", port, "User:", db_user)

	db, err := sql.Open("postgres", psqlInfo)

	if err != nil {
		panic(err)
	}

	log.Println("Postgres Database Connection Established...")
	return db
}
