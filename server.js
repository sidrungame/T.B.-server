const WebSocket = require("ws");

const port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port });

console.log("Serveur multijoueur prêt sur port " + port);

// joueurs connectés
const players = {};

// joueurs déconnectés récemment
const disconnectedPlayers = {};

const DISCONNECT_MEMORY = 5 * 60 * 1000; // 5 minutes

wss.on("connection", (ws) => {

    ws.pseudo = null;

    ws.on("message", (msg) => {

        const message = msg.toString().trim();

        // =============================
        // CONNEXION JOUEUR
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
        // PING LISTE JOUEURS
        // =============================
        if (message.startsWith("PING|")) {

            let list = "Joueurs connectés:\n";

            let i = 1;

            for (const pseudo in players) {

                list += `#${i}${pseudo}#${i}b\n`;

                i++;

            }

            ws.send(list.trim());

            return;
        }

        // =============================
        // UPDATE POSITION JOUEUR
        // =============================
        if (message.startsWith("POS|")) {

            if (!ws.pseudo) return;

            const data = message.slice(4);

            // envoyer la position à tous les joueurs
            for (const pseudo in players) {

                if (players[pseudo] !== ws) {
                    players[pseudo].send(`POS|${ws.pseudo}/${data}`);
                }

            }

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
