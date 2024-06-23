package controllers

import (
	"encoding/json"
	"net/http"
)

type HistoryMessage struct {
	Content   string `json:"content"`
	UserName  string `json:"username"`
	CreatedAt string `json:"created_at"`
	MessageId string `json:"message_id"`
}

func GetHistoryMessages(w http.ResponseWriter, r *http.Request) {
	tokenString := r.Header.Get("Authorization")
	if !(authMiddleWare(tokenString)) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "No Authorization"})
		return
	}

	rows, err := db.Query(`SELECT
    u.username,
    m.content,
    m.created_at,
    m.id
FROM
    "Message" m
INNER JOIN
    "User" u ON m.user_id = u.id
ORDER BY
    m.created_at ASC;`)
	if err != nil {
		http.Error(w, "Failed to retrieve historyMessages", http.StatusBadRequest)
		return
	}
	defer rows.Close()

	var historyMessages []HistoryMessage
	for rows.Next() {
		var msg HistoryMessage
		if err := rows.Scan(&msg.UserName, &msg.Content, &msg.CreatedAt, &msg.MessageId); err != nil {
			http.Error(w, "Failed to read message data", http.StatusInternalServerError)
			return
		}
		historyMessages = append(historyMessages, msg)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(historyMessages)
}

func authMiddleWare(tokenString string) bool {
	if tokenString == "" {
		return false
	}
	tokenString = tokenString[len("Bearer "):]

	err := verifyToken(tokenString)
	if err != nil {
		return false
	}
	return true
}
