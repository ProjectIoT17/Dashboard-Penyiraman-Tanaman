/**************** MQTT CONFIG ****************/
const client = mqtt.connect(
  "wss://d8b9ac96f2374248a0784545f5e59901.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "Penyiraman_Otomatis",
    password: "Pro111816",
    reconnectPeriod: 3000,
    clean: true
  }
);

/**************** ELEMENT ****************/
const mqttStatus = document.getElementById("mqttStatus");
const espStatus  = document.getElementById("espStatus");

const soilEl  = document.getElementById("soil");
const voltEl  = document.getElementById("volt");
const currEl  = document.getElementById("current");
const powerEl = document.getElementById("power");
const modeEl  = document.getElementById("mode");
const pompaEl = document.getElementById("pompa");

/**************** HEARTBEAT STATE ****************/
let lastHeartbeat = 0;
let hasBeenOnline = false;

const HEARTBEAT_TIMEOUT = 6000; // ms

// Status awal
espStatus.textContent = "CHECKING...";
espStatus.className = "checking";

/**************** MQTT EVENTS ****************/
client.on("connect", () => {
  mqttStatus.textContent = "CONNECTED";
  mqttStatus.className = "ok";
  client.subscribe("irrigation/#");
});

client.on("offline", () => {
  mqttStatus.textContent = "DISCONNECTED";
  mqttStatus.className = "bad";
});

/**************** MESSAGE HANDLER ****************/
client.on("message", (topic, msg) => {
  const data = msg.toString();

  // ===== HEARTBEAT =====
  if (topic === "irrigation/heartbeat") {
    lastHeartbeat = Date.now();
    hasBeenOnline = true;

    espStatus.textContent = "ONLINE";
    espStatus.className = "ok";
    return;
  }

  // ===== DATA =====
  if (topic === "irrigation/soil") soilEl.textContent = data;
  if (topic === "irrigation/voltage") voltEl.textContent = data;
  if (topic === "irrigation/current") currEl.textContent = data;
  if (topic === "irrigation/power") powerEl.textContent = data;
  if (topic === "irrigation/mode") modeEl.textContent = data === "1" ? "AUTO" : "MANUAL";
  if (topic === "irrigation/pump") pompaEl.textContent = data === "1" ? "ON" : "OFF";
});

/**************** HEARTBEAT MONITOR ****************/
setInterval(() => {
  if (!hasBeenOnline) {
    // Belum pernah online → tetap CHECKING
    espStatus.textContent = "CHECKING...";
    espStatus.className = "checking";
    return;
  }

  if (Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT) {
    espStatus.textContent = "OFFLINE";
    espStatus.className = "bad";
  }
}, 2000);

/**************** CONTROL ****************/
function toggleMode() {
  client.publish("irrigation/cmd/mode", "TOGGLE");
}

function setPump(state) {
  client.publish("irrigation/cmd/pump", state);
}
