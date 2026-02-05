/*********************************************************
 * MQTT CONFIG
 *********************************************************/
const client = mqtt.connect(
  "wss://d8b9ac96f2374248a0784545f5e59901.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "Penyiraman_Otomatis",
    password: "Pro111816",
    reconnectPeriod: 2000,   // lebih cepat reconnect
    clean: true
  }
);

/*********************************************************
 * ELEMENT
 *********************************************************/
const mqttStatus = document.getElementById("mqttStatus");
const espStatus  = document.getElementById("espStatus");

const soilEl  = document.getElementById("soil");
const voltEl  = document.getElementById("volt");
const currEl  = document.getElementById("current");
const powerEl = document.getElementById("power");
const modeEl  = document.getElementById("mode");
const pompaEl = document.getElementById("pompa");

/*********************************************************
 * HEARTBEAT STATE
 *********************************************************/
let lastHeartbeat = 0;
let everOnline = false;

const HEARTBEAT_TIMEOUT = 3500; // 🔥 cepat OFFLINE
const CHECKING_TIMEOUT  = 3000; // 🔥 checking singkat
const pageStart = Date.now();

// Status awal
espStatus.textContent = "CHECKING...";
espStatus.className = "checking";

/*********************************************************
 * CHART
 *********************************************************/
const ctx = document.getElementById("soilChart").getContext("2d");

const soilChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Kelembapan (%)",
      data: [],
      borderColor: "#2ecc71",
      backgroundColor: "rgba(46,204,113,0.25)",
      tension: 0.35,
      fill: true
    }]
  },
  options: {
    responsive: true,
    animation: false,
    scales: { y: { min: 0, max: 100 } }
  }
});

function addSoilData(val) {
  soilChart.data.labels.push(new Date().toLocaleTimeString());
  soilChart.data.datasets[0].data.push(val);

  if (soilChart.data.labels.length > 20) {
    soilChart.data.labels.shift();
    soilChart.data.datasets[0].data.shift();
  }
  soilChart.update();
}

/*********************************************************
 * MQTT EVENTS
 *********************************************************/
client.on("connect", () => {
  mqttStatus.textContent = "CONNECTED";
  mqttStatus.className = "ok";
  client.subscribe("irrigation/#");
});

client.on("offline", () => {
  mqttStatus.textContent = "DISCONNECTED";
  mqttStatus.className = "bad";
});

/*********************************************************
 * MESSAGE HANDLER
 *********************************************************/
client.on("message", (topic, msg) => {
  const data = msg.toString();

  // ===== HEARTBEAT =====
  if (topic === "irrigation/heartbeat") {
    lastHeartbeat = Date.now();
    everOnline = true;

    espStatus.textContent = "ONLINE";
    espStatus.className = "ok";
    return;
  }

  // ===== DATA =====
  if (topic === "irrigation/soil") {
    soilEl.textContent = data;
    addSoilData(Number(data));
  }
  if (topic === "irrigation/voltage") voltEl.textContent = data;
  if (topic === "irrigation/current") currEl.textContent = data;
  if (topic === "irrigation/power")   powerEl.textContent = data;
  if (topic === "irrigation/mode")    modeEl.textContent = data === "1" ? "AUTO" : "MANUAL";
  if (topic === "irrigation/pump")    pompaEl.textContent = data === "1" ? "ON" : "OFF";
});

/*********************************************************
 * STATUS MONITOR (RESPONS CEPAT)
 *********************************************************/
setInterval(() => {
  const now = Date.now();

  // BELUM ADA HEARTBEAT SAMA SEKALI
  if (!everOnline) {
    if (now - pageStart < CHECKING_TIMEOUT) {
      espStatus.textContent = "CHECKING...";
      espStatus.className = "checking";
    } else {
      espStatus.textContent = "OFFLINE";
      espStatus.className = "bad";
    }
    return;
  }

  // PERNAH ONLINE → CEK TIMEOUT
  if (now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
    espStatus.textContent = "OFFLINE";
    espStatus.className = "bad";
  }
}, 1000);

/*********************************************************
 * CONTROL
 *********************************************************/
function toggleMode() {
  client.publish("irrigation/cmd/mode", "TOGGLE");
}

function setPump(state) {
  client.publish("irrigation/cmd/pump", state);
}
