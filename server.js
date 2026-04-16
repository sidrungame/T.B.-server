const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });

let waitingPlayer = null;

wss.on("connection", (ws) => {
  console.log("👤 Joueur connecté");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    // matchmaking simple
    if (data.type === "join") {
      if (waitingPlayer) {
        ws.opponent = waitingPlayer;
        waitingPlayer.opponent = ws;

        ws.send(JSON.stringify({ type: "start", role: "player2" }));
        waitingPlayer.send(JSON.stringify({ type: "start", role: "player1" }));

        waitingPlayer = null;
      } else {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: "waiting" }));
      }
      return;
    }

    // relayer au joueur adverse
    if (ws.opponent && ws.opponent.readyState === WebSocket.OPEN) {
      ws.opponent.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    console.log("❌ Déconnexion");

    if (ws.opponent) {
      ws.opponent.send(JSON.stringify({ type: "opponent_left" }));
      ws.opponent.opponent = null;
    }

    if (waitingPlayer === ws) {
      waitingPlayer = null;
    }
  });
});
