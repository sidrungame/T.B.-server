const WebSocket = require("ws");

const port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port });

console.log("Serveur positions prêt sur port " + port);

// joueurs connectés
const players = {}; // { pseudo: websocket }

wss.on("connection", (ws) => {

    ws.pseudo = null;

    ws.on("message", (msg) => {

        const message = msg.toString().trim();

        // =============================
        // ENREGISTREMENT DU JOUEUR
        // =============================
        if (message.startsWith("J|")) {

            const pseudo = message.slice(2);

            if (players[pseudo]) {
                ws.send("pseudo déjà utilisé");
                return;
            }

            ws.pseudo = pseudo;
            players[pseudo] = ws;

            ws.send("connecté");

            console.log(pseudo + " connecté");

            return;
        }

        // =============================
        // DEMANDE POSITION
        // =============================
        if (message.startsWith("P|")) {

            const target = message.slice(2);
            const requester = ws.pseudo;

            if (!requester) {
                ws.send("non enregistré");
                return;
            }

            if (!players[target]) {
                ws.send("joueur introuvable");
                return;
            }

            players[target].send("EP|" + requester);

            return;
        }

        // =============================
        // ENVOI POSITION
        // =============================
        if (message.startsWith("EPP|")) {

            const data = message.slice(4);
            const parts = data.split("/");

            const requester = parts[0];
            const positionData = parts.slice(1).join("/");

            const sender = ws.pseudo;

            if (!players[requester]) {
                ws.send("demandeur introuvable");
                return;
            }

            players[requester].send(`EPP|${sender}/${positionData}`);

            return;
        }

    });

    // =============================
    // DECONNEXION
    // =============================
    ws.on("close", () => {

        if (ws.pseudo && players[ws.pseudo]) {
            delete players[ws.pseudo];
            console.log(ws.pseudo + " déconnecté");
        }

    });

});
