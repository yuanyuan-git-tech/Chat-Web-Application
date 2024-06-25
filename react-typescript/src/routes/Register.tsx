import {
    Avatar,
    Box,
    Button,
    Container,
    CssBaseline,
    Grid,
    TextField,
    Typography,
} from "@mui/material";
import {LockOutlined} from "@mui/icons-material";
import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {register} from "../services/auth";
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

const Register = () => {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmedPassword, setConfirmedPassword] = useState("");

    const [userNameError, setUserNameError] = useState("")
    const [passwordError, setPasswordError] = useState("")

    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        setUserNameError("")
        setPasswordError("")

        if (userName === "") {
            setUserNameError("Please input username")
            return
        }
        if (password === "" || confirmedPassword === "") {
            setPasswordError("Please input password")
            return
        }
        if (password !== confirmedPassword) {
            setPasswordError("Password does not match")
            return
        }

        await register(userName, password)
            .then((response) => {
                if (response.status === 201) {
                    setSuccess(true)
                } else {
                    setPasswordError("can not register")
                    setUserNameError("can not register")
                    setSuccess(false)
                }
            })
            .catch(error => {
                    setPasswordError("can not register")
                    setUserNameError("can not register")
                    setSuccess(false)
                });
            };

        if (success) {
            return (
                <Container maxWidth="xs">
                    <CssBaseline/>
                    <Box sx={{mt: 20, display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <Avatar sx={{mb: 1, mt: 2, bgcolor: "white"}}>
                            <DoneOutlineIcon sx={{color: "primary.light", fontSize: 40}}/>
                        </Avatar>
                        <Box sx={{mt: 3}}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography align="center" variant="h5">Registration Successful!</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography align="center" variant="body1">Welcome to the Chat
                                        Application!</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                    <Button fullWidth variant="contained" sx={{mt: 5, mb: 2}} onClick={() => navigate("/login")}>
                        Login to your account!
                    </Button>
                </Container>
            );
        }

        return (
            <>
                <Container maxWidth="xs">
                    <CssBaseline/>
                    <Box
                        sx={{
                            mt: 20,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <Avatar sx={{m: 1, bgcolor: "primary.light"}}>
                            <LockOutlined/>
                        </Avatar>
                        <Typography variant="h5">Register</Typography>
                        <Box sx={{mt: 3}}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        name="userName"
                                        required
                                        fullWidth
                                        id="userName"
                                        label="UserName"
                                        autoFocus
                                        value={userName}
                                        error={userNameError !== ""}
                                        onChange={(e) => setUserName(e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type="password"
                                        id="password"
                                        value={password}
                                        error={passwordError !== ""}
                                        helperText={passwordError}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        name="confirmedPassword"
                                        label="Confirm Password"
                                        type="password"
                                        id="confirmedPassword"
                                        value={confirmedPassword}
                                        error={passwordError !== ""}
                                        helperText={passwordError}
                                        onChange={(e) => setConfirmedPassword(e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={{mt: 3, mb: 2}}
                                onClick={handleRegister}
                            >
                                Register
                            </Button>
                            <Grid container justifyContent="flex-front">
                                <Grid item>
                                    <Link to="/login">Have an account? Login</Link>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Container>
            </>
        );
    };

    export default Register;