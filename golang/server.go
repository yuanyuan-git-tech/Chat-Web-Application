package main

import (
	"context"
	"flag"
	"fmt"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"log"
	"main/controllers"
	"main/utils"
	"net/http"
)

func getEnv() {
	var err = godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %s", err)
	}
}

func main() {
	getEnv()

	db := utils.GetConnection()
	redisClient := utils.RedisClient()
	defer redisClient.Close()
	defer db.Close()

	ctx := context.WithValue(context.Background(), "db", db)
	ctx = context.WithValue(ctx, "redisClient", redisClient)
	controllers.SetupController(ctx)

	var port int
	flag.IntVar(&port, "p", 8000, "Provide a port number (default 8000)")
	flag.Parse()

	fmt.Printf("Starting server at port %d\n", port)

	router := mux.NewRouter()
	router.HandleFunc("/login", controllers.Login).Methods("POST")
	router.HandleFunc("/register", controllers.Register).Methods("POST")

	router.HandleFunc("/history", controllers.GetHistoryMessages).Methods("GET")
	router.HandleFunc("/vote-count", controllers.GetCountsHandler).Methods("GET")

	router.HandleFunc("/message", controllers.HandleWebSocketConnections)

	go controllers.HandleContentMessages()
	go controllers.HandleVoteMessages()

	corsMiddleware := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"}),
	)

	handler := corsMiddleware(router)

	portWithColon := fmt.Sprintf(":%d", port)
	if err := http.ListenAndServe(portWithColon, handler); err != nil {
		log.Fatal(err)
	}
}
