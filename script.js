/*********************************************************
 * MQTT CONFIG
 *********************************************************/
const client = mqtt.connect(
  "wss://d8b9ac96f2374248a0784545f5e59901.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "Penyiraman_Otomatis",
    password: "Pro111816",
    reconnectPeriod: 3000,
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
 * ESP32 STATUS STATE
 *********************************************************/
let lastESP32Time = null;       // ⬅️ NULL, bukan 0
let espEverOnline = false;     // ⬅️ FLAG PENTING
const ESP32_TIMEOUT = 10000;   // 10 detik

// Status awal (realistis)
espStatus.textContent = "CHECKING...";
espStatus.className = "checking";

/*********************************************************
 * CHART SETUP
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
      backgroundColor: "rgba(46,204,113,0.3)",
      tension: 0.4,
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

  if (soilChart.data.labels.length > 30) {
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
 * MQTT MESSAGE HANDLER
 *********************************************************/
client.on("message", (topic, msg) => {
  const data = msg.toString();

  // ===== DATA SENSOR SAJA =====
  if (
    topic === "irrigation/soil" ||
    topic === "irrigation/voltage" ||
    topic === "irrigation/current" ||
    topic === "irrigation/power"
  ) {
    lastESP32Time = Date.now();
    espEverOnline = true;

    espStatus.textContent = "ONLINE";
    espStatus.className = "ok";
  }

  // ===== UPDATE UI =====
  if (topic === "irrigation/soil") {
    soilEl.textContent = data;
    addSoilData(Number(data));
  }

  if (topic === "irrigation/voltage") voltEl.textContent = data;
  if (topic === "irrigation/current") currEl.textContent = data;
  if (topic === "irrigation/power") powerEl.textContent = data;
  if (topic === "irrigation/mode") modeEl.textContent = data === "1" ? "AUTO" : "MANUAL";
  if (topic === "irrigation/pump") pompaEl.textContent = data === "1" ? "ON" : "OFF";
});

/*********************************************************
 * ESP32 OFFLINE CHECK (AMAN & REAL-TIME)
 *********************************************************/
setInterval(() => {
  // Jangan OFFLINE kalau belum pernah ONLINE
  if (!espEverOnline) return;

  if (Date.now() - lastESP32Time > ESP32_TIMEOUT) {
    espStatus.textContent = "OFFLINE";
    espStatus.className = "bad";
  }
}, 2000);

/*********************************************************
 * CONTROL BUTTONS
 *********************************************************/
function toggleMode() {
  client.publish("irrigation/cmd/mode", "TOGGLE");
}

function setPump(state) {
  client.publish("irrigation/cmd/pump", state);
}
