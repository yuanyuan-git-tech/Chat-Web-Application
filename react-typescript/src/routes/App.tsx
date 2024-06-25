import React from 'react';
import {Routes, Route} from "react-router-dom"
import Login from "./Login"
import Register from "./Register";
import WebsocketClient from "./WebsocketClient";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />}/>
          <Route path="/login" element={<Login />}/>
        <Route path="/register" element={<Register />}/>
          <Route path="/chat" element={<WebsocketClient />}/>
      </Routes>
    </>
  );
}

export default App;
