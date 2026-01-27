const broker = "wss://d8b9ac96f2374248a0784545f5e59901.s1.eu.hivemq.cloud:8884/mqtt";

const options = {
  username: "Penyiraman_Otomatis",
  password: "Pro111816",
  reconnectPeriod: 2000
};

const client = mqtt.connect(broker, options);
const mqttStatus = document.getElementById("mqttStatus");

client.on("connect", () => {
  mqttStatus.textContent = "CONNECTED";
  mqttStatus.className = "connected";
  client.subscribe("iot/#");
});

client.on("offline", () => {
  mqttStatus.textContent = "OFFLINE";
  mqttStatus.className = "disconnected";
});

client.on("message", (topic, message) => {
  const data = message.toString();

  if (topic === "iot/soil/avg") document.getElementById("soil").innerText = data;
  if (topic === "iot/tegangan") document.getElementById("volt").innerText = data;
  if (topic === "iot/arus") document.getElementById("current").innerText = data;
  if (topic === "iot/daya") document.getElementById("power").innerText = data;
  if (topic === "iot/mode") document.getElementById("mode").innerText = data;
  if (topic === "iot/pompa/status") document.getElementById("pompa").innerText = data;
});

function setMode(mode) {
  client.publish("iot/mode/cmd", mode);
}

function setPump(state) {
  client.publish("iot/pompa/cmd", state);
}
