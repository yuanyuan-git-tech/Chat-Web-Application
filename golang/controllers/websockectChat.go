package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"io"
	"log"
	"net/http"
)

type Message struct {
	Content  string `json:"content"`
	UserName string `json:"username"`
}

type VoteMessage struct {
	MessageID string `json:"message_id"`
	UserName  string `json:"username"`
	VoteType  string `json:"vote_type"` // "upvote" or "downvote"
}

type StoredMessage struct {
	MessageID  string `json:"message_id"`
	Created_At string `json:"created_at"`
	Content    string `json:"content"`
	UserName   string `json:"username"`
}

type VoteUpdate struct {
	MessageID     string `json:"message_id"`
	UpvoteCount   int64  `json:"upvote_count"`
	DownvoteCount int64  `json:"downvote_count"`
	UserName      string `json:"username"`
}

type messageType struct {
	Type string `json:"vote_type"`
}

var (
	clients            = make(map[*websocket.Conn]bool)
	broadcasterMessage = make(chan StoredMessage)
	broadcasterVote    = make(chan VoteUpdate)
	upgrader           = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	ctx = context.Background()
)

func HandleWebSocketConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	ws.SetCloseHandler(func(code int, text string) error {
		delete(clients, ws)
		log.Printf("Closed connection: %v, %s", code, text)
		return nil
	})
	defer ws.Close()
	clients[ws] = true

	for {
		_, p, err := ws.ReadMessage()
		if err != nil {
			log.Printf("read error: %v", err)
			delete(clients, ws)
			break
		}

		// Determine if it's a vote or a content message
		if isVoteMessage(p) {
			var voteMsg VoteMessage
			if err := json.Unmarshal(p, &voteMsg); err != nil {
				log.Printf("error unmarshalling vote message: %v", err)
				continue
			} else {
				// Update the vote count in the redis
				var voteUpdate VoteUpdate
				upvotes, downvotes, err := HandleVote(voteMsg.UserName, voteMsg.MessageID, voteMsg.VoteType)

				if err != nil {
					log.Printf("error updating vote")
					continue
				}
				voteUpdate.UserName = voteMsg.UserName
				voteUpdate.UpvoteCount = upvotes
				voteUpdate.DownvoteCount = downvotes
				voteUpdate.MessageID = voteMsg.MessageID
				broadcasterVote <- voteUpdate
			}

		} else {
			var msg Message
			if err := json.Unmarshal(p, &msg); err != nil {
				log.Printf("error unmarshalling message: %v", err)
			} else {
				var storedMsg StoredMessage
				err := storeMessage(msg, &storedMsg)
				if err != nil {
					log.Printf("Error storing message: %v", err)
					continue
				}
				// send new message to the channel
				broadcasterMessage <- storedMsg
			}
		}
	}
}

func HandleContentMessages() {
	for {
		// grab any next message from channel
		storedMsg := <-broadcasterMessage

		// message every client For Content Message Update
		for client := range clients {
			err := client.WriteJSON(&storedMsg)
			fmt.Println(storedMsg)
			if err != nil && unsafeError(err) {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func HandleVoteMessages() {
	for {
		// grab any next vote message from channel
		voteUpdateMsg := <-broadcasterVote
		for client := range clients {
			if err := client.WriteJSON(voteUpdateMsg); err != nil {
				fmt.Println(voteUpdateMsg)
				log.Printf("error sending vote count: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func storeMessage(msg Message, storedMsg *StoredMessage) error {
	var user_id string
	err := db.QueryRow(`SELECT id FROM "User" WHERE "username" = $1`, msg.UserName).Scan(&user_id)
	query := `INSERT INTO "Message" (user_id, content) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, user_id, msg.Content).Scan(&storedMsg.MessageID, &storedMsg.Created_At)

	storedMsg.Content = msg.Content
	storedMsg.UserName = msg.UserName
	return err
}

func unsafeError(err error) bool {
	// if a message is sent while a client is closing, ignore the error
	return !websocket.IsCloseError(err, websocket.CloseGoingAway) && err != io.EOF
}

func isVoteMessage(data []byte) bool {
	var msg messageType
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("Error unmarshalling data in isVoteMessage: %v", err)
		return false
	}
	return 0 != len(msg.Type)
}
