// ================= MQTT CONFIG =================
const broker = "wss://broker.hivemq.com:8884/mqtt";
const client = mqtt.connect(broker);

// ================= MQTT STATUS =================
const mqttStatus = document.getElementById("mqttStatus");

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

// ================= MQTT RECEIVE =================
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

// ================= CONTROL =================
function setMode(mode) {
  client.publish("iot/mode/cmd", mode);
}

function setPump(state) {
  client.publish("iot/pompa/cmd", state);
}
