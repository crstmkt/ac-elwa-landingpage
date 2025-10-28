// fake-server.js — Happy Path Heater Simulator
// Start:  node fake-server.js
// API:    GET http://127.0.0.1:4000/data.jsn

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors({ origin: true }));
app.use(express.json());

// ---- Statuscodes wie im Frontend ----
const STATUS = {
  HEAT: 2,
  STANDBY: 3,
  BOOST_HEAT: 4,
  HEAT_FINISHED: 5,
  SETUP: 9,
};

// ---- Sim-Parameter ----
const TICK_MS = 2000; // Simulation alle 2 s
const MIN_TEMP = 200; // 20.0°C (Zehntel)
const MAX_TEMP = 800; // 80.0°C
const BAND = 300; // Hysterese: 3.0°C unter Soll wird wieder geheizt

const COOL_RATE = [1, 3]; // −0.1 … −0.3 °C pro Tick
const HEAT_RATE = [6, 14]; // +0.6 … +1.4 °C pro Tick
const BOOST_RATE = [15, 25]; // +1.5 … +2.5 °C pro Tick

// elektrische Leistung (W)
const WATT_NORMAL_MIN = 800,
  WATT_NORMAL_MAX = 2200;
const WATT_BOOST_MIN = 2200,
  WATT_BOOST_MAX = 3000;

// ---- Gerätezustand ----
const state = {
  temp: 300, // 30.0 °C (Zehntel)
  targetTemp: 800, // 80.0 °C (Zehntel)
  powerOn: true, // Geräteschalter
  status: STATUS.SETUP,
  boostUntil: 0, // ms-Timestamp
};

const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isHeating = () =>
  state.powerOn &&
  (state.status === STATUS.HEAT || state.status === STATUS.BOOST_HEAT);

// aktuelle Leistung (0..3000 W) abhängig vom Status
function currentPowerWatt() {
  if (!isHeating()) return 0;
  return state.status === STATUS.BOOST_HEAT
    ? rndInt(WATT_BOOST_MIN, WATT_BOOST_MAX)
    : rndInt(WATT_NORMAL_MIN, WATT_NORMAL_MAX);
}

// ---- Simulation (Happy Path, keine Fehler) ----
setInterval(() => {
  const now = Date.now();
  if (state.boostUntil && now > state.boostUntil) state.boostUntil = 0;

  if (!state.powerOn) {
    // Gerät aus: leichte Abkühlung bis MIN_TEMP
    state.status = STATUS.STANDBY;
    state.temp = clamp(state.temp - rndInt(...COOL_RATE), MIN_TEMP, MAX_TEMP);
  } else {
    // Gerät an: einfache Hysterese um targetTemp
    const needHeat = state.temp <= state.targetTemp - BAND;
    const atOrAboveTarget = state.temp >= state.targetTemp;

    if (needHeat || state.boostUntil) {
      state.status = state.boostUntil ? STATUS.BOOST_HEAT : STATUS.HEAT;
      const rate = state.boostUntil
        ? rndInt(...BOOST_RATE)
        : rndInt(...HEAT_RATE);
      state.temp = clamp(state.temp + rate, MIN_TEMP, MAX_TEMP);
    } else if (atOrAboveTarget) {
      // Erreicht: in Standby langsam etwas „driften“
      state.status = STATUS.STANDBY;
      state.temp = clamp(state.temp - rndInt(...COOL_RATE), MIN_TEMP, MAX_TEMP);
    } else {
      // Nah am Ziel: minimal bewegen, damit sich Werte ändern
      state.status = STATUS.HEAT;
      state.temp = clamp(state.temp + rndInt(1, 3), MIN_TEMP, MAX_TEMP);
    }
  }
}, TICK_MS);

// ---- API ----
app.get("/data.jsn", (_req, res) => {
  const temp = clamp(state.temp, MIN_TEMP, MAX_TEMP);
  const tempC = temp / 10;
  const tempStr = `${tempC.toFixed(1)}°C`;

  res.json({
    // Temperatur in mehreren Varianten (Frontend-Kompatibilität)
    temp, // Zehntel-°C (int), z.B. 605
    temp1: temp, // Alias
    tempC, // °C als Zahl, z.B. 60.5
    temperature: tempC, // Alias
    tempStr, // "60.5°C"

    status: state.status, // 2/3/4/5/9
    targetTemp: state.targetTemp, // Zehntel-°C
    power: currentPowerWatt(), // **numerisch** 0..3000 W
    powerOn: state.powerOn, // bool (Schalter)
    timestamp: new Date().toISOString(),
  });
});

// Zieltemperatur setzen: { targetTemp: int (Zehntel-°C) } — Happy Path
app.post("/target", (req, res) => {
  const v = Number(req.body?.targetTemp);
  if (!Number.isFinite(v))
    return res.status(400).json({ error: "targetTemp (int) erwartet" });
  state.targetTemp = clamp(Math.round(v), MIN_TEMP, MAX_TEMP);
  // Bei größerer Differenz optional kurz boosten
  if (state.powerOn && state.targetTemp - state.temp > BAND) {
    state.boostUntil = Date.now() + 30_000;
  }
  res.json({ ok: true, targetTemp: state.targetTemp });
});

// Power schalten: { powerOn: bool } ODER { power: bool } — Happy Path
app.post("/power", (req, res) => {
  const bodyPower =
    typeof req.body?.power === "boolean" ? req.body.power : undefined;
  const on =
    typeof req.body?.powerOn === "boolean" ? req.body.powerOn : bodyPower;
  if (typeof on !== "boolean")
    return res.status(400).json({ error: "powerOn (bool) erwartet" });
  state.powerOn = on;
  if (!on) {
    state.status = STATUS.STANDBY;
    state.boostUntil = 0;
  }
  res.json({ ok: true, powerOn: state.powerOn });
});

// Boost manuell aktivieren: { seconds?: number } — Happy Path
app.post("/boost", (req, res) => {
  const sec = clamp(Number(req.body?.seconds ?? 30), 5, 120);
  state.boostUntil = Date.now() + sec * 1000;
  res.json({ ok: true, boostUntil: state.boostUntil });
});

// Reset (optionale Felder): { temp?, targetTemp?, powerOn? } — Happy Path
app.post("/reset", (req, res) => {
  if (Number.isFinite(req.body?.temp))
    state.temp = clamp(Math.round(req.body.temp), MIN_TEMP, MAX_TEMP);
  if (Number.isFinite(req.body?.targetTemp))
    state.targetTemp = clamp(
      Math.round(req.body.targetTemp),
      MIN_TEMP,
      MAX_TEMP
    );
  if (typeof req.body?.powerOn === "boolean") state.powerOn = req.body.powerOn;
  state.status = STATUS.SETUP;
  state.boostUntil = 0;
  res.json({ ok: true, state });
});

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, HOST, () => {
  console.log(`Fake backend läuft auf http://${HOST}:${PORT}`);
});
