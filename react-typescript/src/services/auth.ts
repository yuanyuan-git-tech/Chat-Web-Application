const API_URL = "http://localhost:8000/";

export const register = (username: string, password: string) => {
    return fetch(API_URL + "register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password
        }),
    });
};

export const login = (username: string, password: string) => {
    return fetch(API_URL + "login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password
        })
    })
};

