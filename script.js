/**************** CONFIG ****************/
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

/**************** STATUS STATE ****************/
let lastHeartbeat = 0;
let firstHeartbeatReceived = false;

const HEARTBEAT_TIMEOUT = 6000; // ms
const CHECKING_TIMEOUT  = 5000; // ms
const pageLoadTime = Date.now();

/**************** CHART ****************/
const ctx = document.getElementById("soilChart").getContext("2d");

const soilChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Kelembapan (%)",
      data: [],
      borderColor: "#2ecc71",
      backgroundColor: "rgba(46, 204, 113, 0.2)",
      tension: 0.3,
      fill: true
    }]
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      y: { min: 0, max: 100 }
    }
  }
});

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
    firstHeartbeatReceived = true;

    espStatus.textContent = "ONLINE";
    espStatus.className = "ok";
    return;
  }

  // ===== SENSOR =====
  if (topic === "irrigation/soil") {
    soilEl.textContent = data;

    const now = new Date().toLocaleTimeString();
    soilChart.data.labels.push(now);
    soilChart.data.datasets[0].data.push(Number(data));

    if (soilChart.data.labels.length > 15) {
      soilChart.data.labels.shift();
      soilChart.data.datasets[0].data.shift();
    }

    soilChart.update();
  }

  if (topic === "irrigation/voltage") voltEl.textContent = data;
  if (topic === "irrigation/current") currEl.textContent = data;
  if (topic === "irrigation/power")   powerEl.textContent = data;
  if (topic === "irrigation/mode")    modeEl.textContent = data === "1" ? "AUTO" : "MANUAL";
  if (topic === "irrigation/pump")    pompaEl.textContent = data === "1" ? "ON" : "OFF";
});

/**************** STATUS MONITOR ****************/
setInterval(() => {
  const now = Date.now();

  // BELUM PERNAH heartbeat
  if (!firstHeartbeatReceived) {
    if (now - pageLoadTime < CHECKING_TIMEOUT) {
      espStatus.textContent = "CHECKING...";
      espStatus.className = "checking";
    } else {
      espStatus.textContent = "OFFLINE";
      espStatus.className = "bad";
    }
    return;
  }

  // PERNAH ONLINE → cek timeout
  if (now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
    espStatus.textContent = "OFFLINE";
    espStatus.className = "bad";
  }
}, 1000);

/**************** CONTROL ****************/
function toggleMode() {
  client.publish("irrigation/cmd/mode", "TOGGLE");
}

function setPump(state) {
  client.publish("irrigation/cmd/pump", state);
}
