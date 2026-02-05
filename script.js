const client = mqtt.connect(
  "wss://d8b9ac96f2374248a0784545f5e59901.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "Penyiraman_Otomatis",
    password: "Pro111816",
    reconnectPeriod: 3000
  }
);

const mqttStatus = document.getElementById("mqttStatus");
const espStatus  = document.getElementById("espStatus");

let lastESP32 = 0;

/* ===== CHART ===== */
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

/* ===== MQTT ===== */
client.on("connect", () => {
  mqttStatus.textContent = "CONNECTED";
  mqttStatus.className = "ok";
  client.subscribe("irrigation/#");
});

client.on("message", (topic, msg) => {
  const data = msg.toString();
  lastESP32 = Date.now();
  espStatus.textContent = "ONLINE";
  espStatus.className = "ok";

  if (topic === "irrigation/soil") {
    soil.textContent = data;
    addSoilData(Number(data));
  }
  if (topic === "irrigation/voltage") volt.textContent = data;
  if (topic === "irrigation/current") current.textContent = data;
  if (topic === "irrigation/power") power.textContent = data;
  if (topic === "irrigation/mode") mode.textContent = data === "1" ? "AUTO" : "MANUAL";
  if (topic === "irrigation/pump") pompa.textContent = data === "1" ? "ON" : "OFF";
});

setInterval(() => {
  if (Date.now() - lastESP32 > 10000) {
    espStatus.textContent = "OFFLINE";
    espStatus.className = "bad";
  }
}, 2000);

function toggleMode() {
  client.publish("irrigation/cmd/mode", "TOGGLE");
}
function setPump(v) {
  client.publish("irrigation/cmd/pump", v);
}
