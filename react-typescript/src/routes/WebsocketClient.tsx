import React, {useEffect, useState} from 'react';
import Cookies from "universal-cookie";
import {Box, Container, CssBaseline, Grid, Stack, TextField, Typography} from "@mui/material";
import MessageCard from "../components/MessageCard";
import IconButton from "@mui/material/IconButton";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {useNavigate} from "react-router-dom";

interface BaseMessage {
    message_id: string;
    username: string;
}

interface VoteCount {
    message_id: string;
    upvote_count: number;
    downvote_count: number;
}

interface VoteMessage extends BaseMessage {
    upvote_count: number;
    downvote_count: number;
}

interface StoredMessage extends BaseMessage {
    created_at: string;
    content: string;
    upvote_count?: number;
    downvote_count?: number;
}

type MessageData = VoteMessage | StoredMessage;

const WebsocketClient = () => {
    let [ws, setWs] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<StoredMessage[]>([]);
    const [content, setContent] = useState('');
    const cookies = new Cookies();
    const accessToken = cookies.get('access-token');
    const navigate = useNavigate();
    const [auth, setAuth] = useState(false);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const fetchData = async () => {
        try {
            const voteResponse = await fetch('http://localhost:8000/vote-count', {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
            const messageResponse = await fetch('http://localhost:8000/history', {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            if (!voteResponse.ok || !messageResponse.ok) {
                throw new Error('Network response was not ok');
            }

            const voteCounts: VoteCount[] = await voteResponse.json() || [];

            const messages: StoredMessage[] = await messageResponse.json() || [];

            // Merge vote counts into messages
            const voteCountMap = new Map(voteCounts.map(vote => [vote.message_id, [vote.upvote_count, vote.downvote_count]]));
            const mergedMessages = messages.map(message => ({
                ...message,
                ...voteCountMap.get(message.message_id) || {upvote_count: 0, downvote_count: 0}
            })) as StoredMessage[];
            setMessages(mergedMessages);
            setAuth(true);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setAuth(false);
            navigate("/login");
        }
    };

    useEffect(() => {
        fetchData();
        setupWebSocket(new WebSocket("ws://localhost:8000/message"));
    }, [accessToken, navigate]);


    const setupWebSocket = (websocket: WebSocket) => {
        websocket.onopen = () => console.log('WebSocket Connected');
        websocket.onmessage = (event) => {
            const incomingMessage = JSON.parse(event.data) as MessageData;
            setMessages(prevMessages => {
                const existingIndex = prevMessages.findIndex(msg => msg.message_id === incomingMessage.message_id);
                if (existingIndex > -1) {
                    const updatedMessages = [...prevMessages];
                    const existingMessage = prevMessages[existingIndex];
                    updatedMessages[existingIndex] = {
                        ...existingMessage,
                        upvote_count: incomingMessage.upvote_count ?? existingMessage.upvote_count,
                        downvote_count: incomingMessage.downvote_count ?? existingMessage.downvote_count
                    };
                    return updatedMessages;
                } else {
                    return [...prevMessages, incomingMessage as StoredMessage];
                }
            });
        };
        websocket.onclose = () => console.log('WebSocket Disconnected');
        setWs(websocket);
    };

    const sendMessage = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const username = cookies.get('user') || '';
            const messageData = {
                username: String(username),
                content: content
            };
            ws.send(JSON.stringify(messageData));
            console.log("Sent:", JSON.stringify(messageData));
            setContent('');
        } else {
            console.error("WebSocket is not open.");
        }
    };

    if (!auth) {
        return <>
            <Box sx={{
                mt: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}>
                <Typography variant="h5">You have not login! Redirecting to login page...</Typography>
            </Box>
        </>
    }

    return (
        <>
            <Container sx={{m: 'auto', position: 'relative', pb: 8}}>
                <CssBaseline/>
                <Box sx={{
                    maxHeight: 700,
                    overflow: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: 3,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Stack spacing={4} sx={{flexGrow: 1}}>
                        {messages.length === 0 ?
                            <>
                                <Box
                                    sx={{flexGrow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <Typography variant="h6" color="textSecondary">No messages yet.</Typography>
                                </Box>
                            </> :
                            (messages?.map((msg, index) => (
                                <MessageCard userName={msg.username}
                                             time={formatDate(msg.created_at)}
                                             content={msg.content}
                                             message_id={msg.message_id}
                                             websocket={ws}
                                             upvoteCount={msg.upvote_count}
                                             downvoteCount={msg.downvote_count}
                                />
                            )))
                        }
                    </Stack>
                </Box>

                <Grid container spacing={2}
                      sx={{position: 'fixed', bottom: 150, left: '50%', width: '100%', borderRadius: 2}}>
                    <Grid>
                        <TextField
                            id="messageInput"
                            placeholder="Write here..."
                            multiline
                            autoFocus
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            size="medium"
                            fullWidth
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={2}>
                        <IconButton
                            size="large" color="primary" aria-label="send a messgae"
                            onClick={sendMessage}
                        >
                            <SendRoundedIcon/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Container>
        </>
    )
};

export default WebsocketClient;
