import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { PolygonConnect } from "./PolygonConnect";
import "./App.css";

function App() {
  return (
    <div className="container">
      <hr className="divider" />
      <div className="card">
        <h2>Polygon Wallet</h2>
        <PolygonConnect />
      </div>
    </div>
  );
}

export default App;
