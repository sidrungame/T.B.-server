const WebSocket = require("ws");

const PORT = 3000;
const wss = new WebSocket.Server({ host: "0.0.0.0", port: PORT });

console.log(`🟢 Serveur prêt sur ws://0.0.0.0:${PORT}`);

wss.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`👤 Nouveau joueur connecté depuis ${ip}`);

  ws.on("message", (msg) => {
    console.log(`📩 Message reçu : ${msg.toString()}`);

    // envoi à tous les autres clients SAUF l'expéditeur
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client !== ws) {
        client.send(msg.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ Joueur déconnecté");
  });
});
