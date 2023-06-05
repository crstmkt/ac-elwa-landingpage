import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
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

  const getBackgroundColor = (temperature) => {
    if (temperature < 470) {
      return "blue";
    } else if (temperature < 570) {
      return "#5553E8";
    } else if (temperature < 670) {
      return "#FF77A6";
    } else {
      return "red";
    }
  };

  return (
    <div className="container">
      <div
        className="boiler"
        style={{ backgroundColor: getBackgroundColor(boilerJson?.temp1) }}
      >
        <h1>
          {typeof boilerJson === "undefined"
            ? null
            : formatTemp(boilerJson.temp1)}
        </h1>
      </div>
      <div className="progress-bar">
        <div
          className="progress"
          style={{ width: `${(boilerJson?.power / 3000) * 100}%` }}
        ></div>
      </div>
      <div className="power">
        {typeof boilerJson === "undefined" ? null : `${boilerJson.power}W`}
      </div>
    </div>
    // <div>
    //           <h1>
    //             {typeof boilerJson === "undefined"
    //               ? null
    //               : formatTemp(boilerJson.temp1)}
    //           </h1>
    //           <h1>
    //             {" "}
    //             {typeof boilerJson === "undefined"
    //               ? null
    //               : convertStatus(boilerJson.status)}
    //           </h1>
    //           <h1>
    //             {typeof boilerJson === "undefined"
    //               ? null
    //               : boilerJson.power + "W"}
    //           </h1>
    //         </div>
  );
}

export default App;
