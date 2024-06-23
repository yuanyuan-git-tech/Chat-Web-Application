package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis/v8"
	"log"
	"net/http"
	"strings"
)

type Response struct {
	MessageId string `json:"message_id"`
	Upvote    int64  `json:"upvote_count"`
	Downvote  int64  `json:"downvote_count"`
}

func GetCountsHandler(w http.ResponseWriter, r *http.Request) {
	tokenString := r.Header.Get("Authorization")
	if !(authMiddleWare(tokenString)) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "No Authorization"})
		return
	}

	//err := redisClient.FlushAll(ctx).Err()
	//if err != nil {
	//	log.Fatalf("Could not flush Redis data: %v", err)
	//}

	voteCounts, err := getAllVoteCounts()
	if err != nil {
		http.Error(w, "Failed to fetch vote counts", http.StatusInternalServerError)
		log.Printf("Error fetching vote counts: %v", err)
		return
	}

	// Convert voteCounts to []Response
	responses := make([]Response, len(voteCounts))
	for i, vc := range voteCounts {
		responses[i] = Response{
			MessageId: vc.MessageID,
			Upvote:    vc.Upvotes,
			Downvote:  vc.Downvotes,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(responses); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		log.Printf("Error encoding response: %v", err)
	}
}

type VoteCounts struct {
	MessageID string
	Upvotes   int64
	Downvotes int64
}

// getAllVoteCounts fetches all messages with their respective upvote and downvote counts
func getAllVoteCounts() ([]VoteCounts, error) {
	var voteCounts []VoteCounts
	var cursor uint64
	var err error

	for {
		var keys []string
		keys, cursor, err = redisClient.Scan(ctx, cursor, "message:*:votes", 10).Result()
		if err != nil {
			return nil, err
		}

		for _, key := range keys {
			// Extract the messageID from the key pattern "message:{messageID}:votes"
			parts := strings.Split(key, ":")
			if len(parts) < 3 {
				log.Printf("Invalid key format: %s", key)
				continue
			}
			// Correctly identifying the messageID part which is always after the first colon and before ':votes'
			messageID := parts[1]

			upvotes, downvotes, _ := getVoteCounts(key)

			voteCounts = append(voteCounts, VoteCounts{
				MessageID: messageID,
				Upvotes:   upvotes,
				Downvotes: downvotes,
			})
		}

		if cursor == 0 {
			break
		}
	}

	return voteCounts, nil
}

func HandleVote(userName, messageID, voteType string) (int64, int64, error) {
	fmt.Println(userName + ":" + messageID + " " + voteType)
	userVoteKey := fmt.Sprintf("message:%s:user:%s", messageID, userName)
	votesKey := fmt.Sprintf("message:%s:votes", messageID)

	// Start a transaction
	err := redisClient.Watch(ctx, func(tx *redis.Tx) error {
		// Retrieve the current vote of the user
		currentVote, err := tx.Get(ctx, userVoteKey).Result()
		if err != nil && err != redis.Nil {
			return err
		}

		pipe := tx.TxPipeline()

		// Cancel the vote if the user votes the same way again
		if currentVote == voteType {
			pipe.Del(ctx, userVoteKey)
			if err := updateVoteCount(pipe, votesKey, voteType, -1); err != nil {
				return err
			}
		} else {
			// If changing the vote
			if currentVote != "" && currentVote != voteType {
				// Decrement the previous vote
				if err := updateVoteCount(pipe, votesKey, currentVote, -1); err != nil {
					return err
				}
			}
			// Increment the new vote
			if err := updateVoteCount(pipe, votesKey, voteType, 1); err != nil {
				return err
			}

			pipe.Set(ctx, userVoteKey, voteType, 0)
		}

		// Execute the transaction
		_, err = pipe.Exec(ctx)
		return err
	}, userVoteKey)

	if err != nil {
		return 0, 0, err
	}

	// Retrieve updated vote counts
	upvotes, downvotes, err := getVoteCounts(votesKey)
	if err != nil {
		return 0, 0, err
	}

	return upvotes, downvotes, nil
}

func getVoteCounts(votesKey string) (int64, int64, error) {
	upvotes, err := redisClient.HGet(ctx, votesKey, "upvotes").Int64()
	if err != nil && err != redis.Nil {
		return 0, 0, err
	}
	downvotes, err := redisClient.HGet(ctx, votesKey, "downvotes").Int64()
	if err != nil && err != redis.Nil {
		return 0, 0, err
	}
	return upvotes, downvotes, nil
}

func updateVoteCount(pipe redis.Pipeliner, votesKey, voteType string, delta int64) error {
	field := "upvotes"
	if voteType == "downvote" {
		field = "downvotes"
	}
	pipe.HIncrBy(ctx, votesKey, field, delta)
	return nil
}
