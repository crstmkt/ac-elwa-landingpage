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
    const minTemperature = 350;
    const maxTemperature = 830;

    if (temperature <= minTemperature) {
      return "#0300FF"; // Blau (#0300FF) für Temperaturen unter oder gleich 35 Grad
    } else if (temperature >= maxTemperature) {
      return "#FF0000"; // Rot (#FF0000) für Temperaturen über oder gleich 83 Grad
    } else {
      // Berechne den Farbverlauf zwischen Blau und Rot basierend auf der Temperatur
      const percentage =
        (temperature - minTemperature) / (maxTemperature - minTemperature);
      const red = Math.round(percentage * 255);
      const blue = Math.round((1 - percentage) * 255);

      return `rgb(${red}, 0, ${blue})`;
    }
  };

  // const getBackgroundColor = (temperature) => {
  //   if (temperature < 470) {
  //     return "blue";
  //   } else if (temperature < 570) {
  //     return "#5553E8";
  //   } else if (temperature < 670) {
  //     return "#FF77A6";
  //   } else {
  //     return "red";
  //   }
  // };

  return (
    <div className="container">
      <div
        className={`boiler ${
          convertStatus(boilerJson?.status) === "HEAT" ? "animate" : ""
        }`}
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
  );
}

export default App;
