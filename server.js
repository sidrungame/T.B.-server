const WebSocket = require("ws");

const port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port });

console.log("Serveur positions prêt sur port " + port);

// joueurs connectés
const players = {}; 

// joueurs déconnectés récemment
const disconnectedPlayers = {}; 
// { pseudo: { reason: "...", time: timestamp } }

const DISCONNECT_MEMORY = 5 * 60 * 1000; // 5 minutes

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
        // VERIFIER SI JOUEUR PRESENT
        // =============================
        if (message.startsWith("L|")) {

            const pseudo = message.slice(2);

            if (players[pseudo]) {
                ws.send("online");
            } else {
                ws.send("offline");
            }

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

            // joueur en ligne
            if (players[target]) {
                players[target].send("EP|" + requester);
                return;
            }

            // joueur récemment déco
            if (disconnectedPlayers[target]) {

                const info = disconnectedPlayers[target];

                if (Date.now() - info.time < DISCONNECT_MEMORY) {
                    ws.send(`JD|${target}/${info.reason}`);
                    return;
                }

                delete disconnectedPlayers[target];
            }

            ws.send("joueur introuvable");

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

        // =============================
        // DECONNEXION AVEC RAISON
        // =============================
        if (message.startsWith("D|")) {

            const reason = message.slice(2);
            const pseudo = ws.pseudo;

            if (!pseudo) return;

            disconnectedPlayers[pseudo] = {
                reason: reason,
                time: Date.now()
            };

            delete players[pseudo];

            ws.close();

            console.log(pseudo + " expulsé : " + reason);

            return;
        }

    });

    // =============================
    // DECONNEXION NORMALE
    // =============================
    ws.on("close", () => {

        if (ws.pseudo && players[ws.pseudo]) {

            disconnectedPlayers[ws.pseudo] = {
                reason: "déconnexion",
                time: Date.now()
            };

            delete players[ws.pseudo];

            console.log(ws.pseudo + " déconnecté");

        }

    });

});
