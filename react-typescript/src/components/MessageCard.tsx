import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import BackgroundLetterAvatars from "./BackgroundLetterAvatars";
import Cookies from "universal-cookie";

interface MessageCardProps {
    userName: string;
    time: string,
    content: string,
    message_id: string,
    upvoteCount?: number,
    downvoteCount?: number,
    websocket: WebSocket | null
}

export default function MessageCard({userName, time, content, message_id, upvoteCount, downvoteCount, websocket}: MessageCardProps) {
    const cookies = new Cookies();
    const user = cookies.get('user');
    const handleVote = async (type: 'upvote' | 'downvote') => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const messageData = {
                vote_type: type,
                username: String(user),
                message_id: message_id
            };
            websocket.send(JSON.stringify(messageData));
            console.log("Sent:", JSON.stringify(messageData));
        } else {
            console.error("WebSocket is not open.");
        }
    };

    return (
        <Card sx={{maxWidth: 1000}} variant="outlined">
            <CardHeader
                avatar={
                    <BackgroundLetterAvatars userName={userName}/>
                }
                title={userName}
                subheader={time}
            />
            <CardContent>
                <Typography variant="body2" color="text.secondary">
                    {content}
                </Typography>
            </CardContent>
            <CardActions disableSpacing>
                <>
                    <IconButton
                        aria-label="upvote" size="small"
                        onClick={() => handleVote('upvote')}
                    >
                        {/* eslint-disable-next-line eqeqeq */}
                        <ThumbUpIcon color={(upvoteCount != undefined && (upvoteCount > 0)) ? "primary" : "action"} />

                    </IconButton>
                    {upvoteCount}
                </>

                <>
                    <IconButton
                        aria-label="downvote" size="small"
                        onClick={() => handleVote('downvote')}
                    >
                        <ThumbDownIcon color={(downvoteCount != undefined && (downvoteCount > 0))  ? "primary" : "action"}/>
                    </IconButton>
                    {downvoteCount}
                </>
            </CardActions>
        </Card>
    );
}
