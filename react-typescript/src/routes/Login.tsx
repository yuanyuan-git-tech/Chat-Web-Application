import { LockOutlined } from "@mui/icons-material";
import {
    Container,
    CssBaseline,
    Box,
    Avatar,
    Typography,
    TextField,
    Button,
    Grid,
} from "@mui/material";
import { useState } from "react";
import {Link, useNavigate} from "react-router-dom";
import {login} from "../services/auth";
import Cookies from 'universal-cookie';

const Login = () => {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const[userNameError, setUserNameError] = useState("")
    const[passwordError, setPasswordError]= useState("")
    const navigate = useNavigate();

    const handleLogin = async () => {
        setUserNameError("")
        setPasswordError("")

        if (userName === "") {
            setUserNameError("Please input username")
        }
        if (password === "") {
            setPasswordError("Please input password")
        }

        const cookies = new Cookies();

        await login(userName, password)
            .then((response) => response.json())
            .then((data) => {
                cookies.set('access-token', data["access-token"], { path: '/' });
                cookies.set('user', userName, { path: '/' });
                setTimeout(() => navigate("/chat"), 500);
            })
            .catch(error => {
                setPasswordError("can not login")
            });
    };
    return (
        <>
            <Container maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        mt: 20,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: "primary.light" }}>
                        <LockOutlined />
                    </Avatar>
                    <Typography variant="h5">Login</Typography>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="userName"
                            label="UserName"
                            name="userName"
                            autoFocus
                            value={userName}
                            error={userNameError !== ""}
                            helperText={userNameError}
                            onChange={(e) => setUserName(e.target.value)}
                        />

                        <TextField
                            error={passwordError !== ""}
                            helperText={passwordError}
                            margin="normal"
                            required
                            fullWidth
                            id="password"
                            name="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={handleLogin}
                        >
                            Login
                        </Button>
                        <Grid container justifyContent={"flex-end"}>
                            <Grid item>
                                <Link to="/register">Do not have an account? Register</Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Container>
        </>
    );
};

export default Login;