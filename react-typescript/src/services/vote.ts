const API_URL = "http://localhost:8000/";

export const getVoteCounts = (accessToken:string, messageId:string) => {
    return fetch(API_URL + "vote-count", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            messageId
        }),
    })
};

