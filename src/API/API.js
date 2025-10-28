// ########## HEIZSTAB #########
export function fetchBoilerJson() {
  return fetch(getApiPath()).then((response) => response.json());
}

function getApiPath() {
  if (window.location.hostname === "localhost") {
    // Lokaler Fake-Server
    return "http://localhost:4000/data.jsn";
  } else if (window.location.protocol === "http:") {
    // Lokales Netzwerk
    return "http://192.168.20.202/data.jsn";
  } else if (window.location.protocol === "https:") {
    // Öffentliche URL
    return "https://heat.stiens.rocks/api/";
  } else {
    // Standard-Pfad, falls das Protokoll nicht http oder https ist
    return;
  }
}

export function formatTemp(temp) {
  if (temp == null || Number.isNaN(Number(temp))) return "–"; // Fallback

  const n = Math.round(Number(temp)); // erwartet z. B. 542 (=54.2°C)
  const neg = n < 0 ? "-" : "";
  const s = Math.abs(n).toString();

  // 1-stellige Werte -> "0.xC"
  if (s.length === 1) return `${neg}0.${s}C`;
  // allgemeiner Fall: letzte Ziffer ist die Nachkommastelle
  return `${neg}${s.slice(0, -1)}.${s.slice(-1)}C`;
}

export function convertStatus(statusNr) {
  switch (statusNr) {
    case 2:
      return "HEAT";
    case 3:
      return "STANDBY";
    case 4:
      return "BOOST HEAT";
    case 5:
      return "HEAT FINISHED";
    case 9:
      return "SETUP";
    case 201:
      return "ERROR OVERTEMP FUSE BLOWN";
    case 202:
      return "ERROR OVERTEMP MEASURED";
    case 203:
      return "ERROR OVERTEMP ELECTRONICS";
    case 204:
      return "ERROR HARDWARE FAULT";
    case 205:
      return "ERROR TEMP SENSOR";
    case 209:
      return "MAINBOARD ERROR";
  }
}
