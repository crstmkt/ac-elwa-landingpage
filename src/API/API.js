// ########## HEIZSTAB #########
export function fetchBoilerJson() {
  return fetch(getApiPath()).then((response) => response.json());
}

function getApiPath() {
  if (window.location.protocol === "http:") {
    return "http://192.168.20.202/data.jsn";
  } else if (window.location.protocol === "https:") {
    return "https://heat.stiens.rocks/api/";
  } else {
    // Standard-Pfad, falls das Protokoll nicht http oder https ist
    return;
  }
}

export function formatTemp(temp) {
  return (
    temp.toString().substring(0, 2) + "." + temp.toString().substring(2) + "C"
  );
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
