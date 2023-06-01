import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import './App.css';
import getItem, { convertStatus, fetchBoilerJson, formatTemp } from "./API/API";

function App() {
  const [boilerJson, setBoilerJson] = useState();

  useEffect(() => {
    fetchBoilerJson().then((data) => setBoilerJson(data));
    const interval = setInterval(() => {
      fetchBoilerJson().then((data) => setBoilerJson(data));
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
              <h1>
                {typeof boilerJson === "undefined"
                  ? null
                  : formatTemp(boilerJson.temp1)}
              </h1>
              <h1>
                {" "}
                {typeof boilerJson === "undefined"
                  ? null
                  : convertStatus(boilerJson.status)}
              </h1>
              <h1>
                {typeof boilerJson === "undefined"
                  ? null
                  : boilerJson.power + "W"}
              </h1>
            </div>
  );
}

export default App;
