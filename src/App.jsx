import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import { ethers } from "ethers";
import { PolygonConnect } from "./PolygonConnect";
import { WalletProvider } from './components/WalletProvider';

import "./App.css";

function App() {
  return (
    <WalletProvider>
      <Router>
        <nav className="navbar">
          <Link style={{ marginRight: "50px" }} to="/">Home</Link>
          <Link style={{ marginRight: "50px" }} to="/admin">Admin</Link>
          {/* <Link to="/user">User</Link> */}
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          {/* <Route path="/user" element={<User />} /> */}
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;
