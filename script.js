/* ================= MQTT CONFIG (HiveMQ Cloud) ================= */
const broker   = "wss:9a08ecfbde8e4479bf7ab89c6ba00867.s1.eu.hivemq.cloud:8884";
const options = {
  username: "Dashboard_ESP32",
  password: "Project18116*",
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 2000
};

const client = mqtt.connect(broker, options);

/* ================= ELEMENT ================= */
const mqttStatus = document.getElementById("mqttStatus");

/* ================= MQTT EVENTS ================= */
client.on("connect", () => {
  mqttStatus.textContent = "CONNECTED";
  mqttStatus.className = "connected";

  client.subscribe("iot/#");
});

client.on("reconnect", () => {
  mqttStatus.textContent = "RECONNECTING...";
  mqttStatus.className = "disconnected";
});

client.on("offline", () => {
  mqttStatus.textContent = "OFFLINE";
  mqttStatus.className = "disconnected";
});

client.on("error", (err) => {
  console.error("MQTT Error:", err);
});

/* ================= RECEIVE DATA ================= */
client.on("message", (topic, message) => {
  const data = message.toString();

  switch (topic) {
    case "iot/soil/avg":
      document.getElementById("soil").innerText = data;
      break;

    case "iot/tegangan":
      document.getElementById("volt").innerText = data;
      break;

    case "iot/arus":
      document.getElementById("current").innerText = data;
      break;

    case "iot/daya":
      document.getElementById("power").innerText = data;
      break;

    case "iot/mode":
      document.getElementById("mode").innerText = data;
      break;

    case "iot/pompa/status":
      document.getElementById("pompa").innerText = data;
      break;
  }
});

/* ================= CONTROL ================= */
function setMode(mode) {
  client.publish("iot/mode/cmd", mode);
}

function setPump(state) {
  client.publish("iot/pompa/cmd", state);
}
