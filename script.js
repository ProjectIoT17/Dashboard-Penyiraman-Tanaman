// ===== MQTT STATUS =====
const mqttStatus = document.getElementById("mqttStatus");

// ===== MQTT CONNECT =====
const client = mqtt.connect(
  "wss://d8b9ac96f2374248a0784545f5e59901.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "Penyiraman_Otomatis",
    password: "Pro111816",
    reconnectPeriod: 3000
  }
);

// ===== MQTT EVENT =====
client.on("connect", () => {
  mqttStatus.textContent = "CONNECTED";
  mqttStatus.className = "connected";
  client.subscribe("irrigation/#");
});

client.on("offline", () => {
  mqttStatus.textContent = "DISCONNECTED";
  mqttStatus.className = "disconnected";
});

// ===== CHART SETUP =====
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
      tension: 0.3,
      fill: true
    }]
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      y: {
        min: 0,
        max: 100
      }
    }
  }
});

// ===== TAMBAH DATA KE GRAFIK =====
function addSoilData(val) {
  const time = new Date().toLocaleTimeString();

  soilChart.data.labels.push(time);
  soilChart.data.datasets[0].data.push(val);

  // simpan 30 data terakhir (~1 menit @2 detik)
  if (soilChart.data.labels.length > 30) {
    soilChart.data.labels.shift();
    soilChart.data.datasets[0].data.shift();
  }

  soilChart.update();
}

// ===== MQTT MESSAGE =====
client.on("message", (topic, message) => {
  const data = message.toString();

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

// ===== CONTROL =====
function setMode() {
  client.publish("irrigation/cmd/mode", "TOGGLE");
}

function setPump(state) {
  client.publish("irrigation/cmd/pump", state);
}
