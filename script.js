const client = mqtt.connect(
  "wss://d8b9ac96f2374248a0784545f5e59901.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "Penyiraman_Otomatis",
    password: "Pro111816",
    clean: true,
    connectTimeout: 2000
  }
);

const mqttStatus = document.getElementById("mqttStatus");
const espStatus  = document.getElementById("espStatus");

let lastESP32Time = 0;

// ================= MQTT =================
client.on("connect", () => {
  mqttStatus.textContent = "CONNECTED";
  mqttStatus.className = "connected";

  client.subscribe("irrigation/#");
});

client.on("reconnect", () => {
  mqttStatus.textContent = "RECONNECTING";
});

client.on("offline", () => {
  mqttStatus.textContent = "OFFLINE";
  mqttStatus.className = "disconnected";
});

client.on("message", (topic, message) => {
  const data = message.toString();

  // 🚨 tanda ESP32 aktif
  lastESP32Time = Date.now();
  espStatus.textContent = "AKTIF";
  espStatus.className = "online";

  if (topic === "irrigation/soil") {
    document.getElementById("soil").innerText = data;
    addChartData(data);
  }

  if (topic === "irrigation/voltage")
    document.getElementById("volt").innerText = data;

  if (topic === "irrigation/current")
    document.getElementById("current").innerText = data;

  if (topic === "irrigation/power")
    document.getElementById("power").innerText = data;

  if (topic === "irrigation/mode")
    document.getElementById("mode").innerText = data === "1" ? "AUTO" : "MANUAL";

  if (topic === "irrigation/pump")
    document.getElementById("pompa").innerText = data === "1" ? "ON" : "OFF";
});

// ================= ESP32 TIMEOUT CHECK =================
setInterval(() => {
  if (Date.now() - lastESP32Time > 10000) {
    espStatus.textContent = "OFFLINE";
    espStatus.className = "offline";
  }
}, 2000);

// ================= KONTROL =================
function toggleMode() {
  client.publish("irrigation/cmd/mode", "TOGGLE");
}

function setPump(val) {
  client.publish("irrigation/cmd/pump", val);
}
