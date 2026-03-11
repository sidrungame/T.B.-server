// server.js
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

console.log("Serveur positions prêt");

// stocker les joueurs connectés
const players = {}; // { pseudo: websocket }

wss.on("connection", (ws) => {

    ws.pseudo = null;

    ws.on("message", (msg) => {

        const message = msg.toString().trim();

        // ----- ENREGISTREMENT DU PSEUDO -----
        if (message.startsWith("J|")) {

            const pseudo = message.slice(2);

            ws.pseudo = pseudo;

            players[pseudo] = ws;

            ws.send("connecté");

            console.log(pseudo + " connecté");

            return;
        }

        // ----- DEMANDE POSITION -----
        if (message.startsWith("P|")) {

            const target = message.slice(2);

            const requester = ws.pseudo;

            if (!players[target]) {
                ws.send("joueur introuvable");
                return;
            }

            // demander au joueur cible sa position
            players[target].send("EP|" + requester);

            return;
        }

        // ----- ENVOI POSITION -----
        if (message.startsWith("EPP|")) {

            const data = message.slice(4);

            const [requester, positionData] = data.split("/");

            const sender = ws.pseudo;

            if (!players[requester]) {
                ws.send("demandeur introuvable");
                return;
            }

            // envoyer la position au demandeur
            players[requester].send(`EPP|${sender}/${positionData}`);

            return;
        }

    });

    ws.on("close", () => {

        if (ws.pseudo && players[ws.pseudo]) {
            delete players[ws.pseudo];
            console.log(ws.pseudo + " déconnecté");
        }

    });

});
