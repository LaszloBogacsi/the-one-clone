class Room {
    constructor(param) {
        this.io = param.io;
        this.roomId = param.roomId;
        this.playerName = param.playerName;
        this.action = param.action;
        this.socket = param.socket;
        this.store = param.io.adapter;
    }

    async initialize() {

        if (this.action === 'join') {
            await this.socket.join(this.roomId)
            this.store = this.store.rooms.get(this.roomId)
            if (this.store.clients) {
                const {gameState} = this.store;
                this.store.clients.push({id: this.socket.id, playerName: this.playerName, isReady: !gameState.inLobby, isAdmin: false, isGuessing: false})
                this.socket.username = this.playerName;
                console.info(`[JOINED] Client ${this.socket.id} joined room ${this.roomId}`);
            } else {
                console.info(`[ERROR] Room ${this.roomId} does not exists, please create the room first`);
            }
        }

        if (this.action === 'create') {
            console.log("create")
            await this.socket.join(this.roomId)
            this.store = this.store.rooms.get(this.roomId)
            this.store.clients = [{id: this.socket.id, playerName: this.playerName, isReady: false, isAdmin: true, isGuessing: false}]
            this.socket.username = this.playerName;
            console.info(`[CREATE] Client ${this.socket.id} created and joined room ${this.roomId}`);
            this.resetGameState()
        }
    }

    showPlayers() {
        this.io.to(this.roomId).emit('show-players', { playersJoined: this.store.clients })
    }

    isReady() {
        this.socket.on('on-ready', () => {
            this.store.clients.forEach(client => {
                if (client.id === this.socket.id) {
                    client.isReady = true
                }
                this.showPlayers()
            })
            const allPlayersReady = this.store.clients.every(client => client.isReady)
            if (allPlayersReady) this.startGame()
        })
        this.socket.on('on-not-ready', () => {
            this.store.clients.forEach(client => {
                if (client.id === this.socket.id) {
                    client.isReady = false
                }
                this.showPlayers()
            })
        })
    }

    getSecretWord() {
        const secretWords = ["secret", "words", "guessing"];
        return secretWords[Math.floor(Math.random()*secretWords.length)]
    }

    resetGameState() {
        this.store.gameState = {
            rounds: [this.newRound()],
            currentRound: 0,
            maxRounds: 2,
            hintTimeout: 20_000,
            guessTimeout: 50_000,
            maxTurn: 3, // 13 turns
            inLobby: true
        }
    }

    startGame() {
        this.resetGameState()
        const {clients, gameState} = this.store;
        gameState.inLobby = false;
        clients.forEach(client => client.isGuessing = false)
        clients[0].isGuessing = true;
        this.showPlayers()
        this.startHintTimeout()
        this.io.to(this.roomId).emit('start-game', {gameState: this.store.gameState})
        console.info(`[CREATE] All players ready, Game starts in ${this.roomId} room`);
    }

    newRound() {
        return {
            turns: [
                this.newTurn()
            ],
            currentTurn: 0,
            points: 0
        };
    }

    showGameState() {
        this.io.to(this.roomId).emit('show-game-state', {gameState: this.store.gameState})
    }

    registerGameHandlers() {
        this.socket.on('on-player-hint-submit', (data) => {
            const {gameState} = this.store;
            const {turns, currentTurn} = gameState.rounds[gameState.currentRound];
            const {hints} = turns[currentTurn];
            hints.push({hint: data.hint, player: this.store.clients.find(c => c.id === this.socket.id), duplicate: false})
            const hintersSoFar = hints.map(hint => hint.player);
            const allHintersHinted = this.store.clients.length === 3 ? hintersSoFar.length === 4 : this.store.clients.filter(client => !client.isGuessing).every(client => hintersSoFar.includes(client))
            console.info(`[INFO] Submitting hint of client ${this.socket.id}`);
            if (allHintersHinted) {
                clearTimeout(this.store.hintTimeout)
                clearInterval(this.store.hintTimeoutCountdown)
                this.markDuplicates(hints)
                this.revealHints(gameState)
                this.startGuessTimeout()
            }
            this.showGameState()
        })

        const getGuessResult = (guess, secretWord) => guess.toUpperCase() === secretWord.toUpperCase() ? 'success' : 'failure';
        const getResult = (data, secretWord) => !data.skip ? getGuessResult(data.guess, secretWord) : "skip";

        function applyResult(gameState, result) {
            switch (result) {
                case "success": {
                    gameState.rounds[gameState.currentRound].points +=1
                    break;
                }
                case "failure": {
                    const round = gameState.rounds[gameState.currentRound];
                    round.currentTurn === gameState.maxTurn ? round.points -= 1 : gameState.maxTurn -= 1
                    break;
                }
                case "skip":
                    break;
                default:
                    break;
            }
        }

        this.socket.on('on-player-guess-submit', (data) => {
            const {gameState} = this.store;
            const {turns, currentTurn} = gameState.rounds[gameState.currentRound];
            const turn = turns[currentTurn];
            turn.guess = data.guess;
            console.info(`[INFO] Submitting guess, client ${this.socket.id}`);

            const result = getResult(data, turn.secretWord);
            applyResult(gameState, result)
            this.io.to(this.roomId).emit('show-turn-result', {result: result})
            clearTimeout(this.store.guessTimeout)
            clearInterval(this.store.guessTimeoutCountdown)
            this.nextTurn()
            this.showGameState()
        })
    }


    newTurn() {
        return {
            secretWord: this.getSecretWord(),
            hints: [],
            reveal: false,
            guess: ""
        }
    }

    nextTurn() {
        const {gameState, clients} = this.store;
        const round = gameState.rounds[gameState.currentRound];
        const isRoundOver = round.currentTurn + 1 > gameState.maxTurn
        if (isRoundOver) this.nextRound()
        else {
            // add new turn
            round.turns.push(this.newTurn());
            clients[round.currentTurn % clients.length].isGuessing = false
            // increment current turn
            round.currentTurn += 1
            // pick new guesser
            clients[round.currentTurn % clients.length].isGuessing = true
            console.info(`[INFO] Next turn in ${this.roomId} for Round:${gameState.currentRound} new Turn:${round.currentTurn} of ${gameState.maxTurn}`);
            this.startHintTimeout()
        }
        this.showPlayers()
    }

    nextRound() {
        const {gameState, clients} = this.store;
        const isGameOver = gameState.currentRound + 1 > gameState.maxRounds;
        if (isGameOver) this.gameOver()
        else {
            // add new round
            gameState.rounds.push(this.newRound());
            // increment current round
            gameState.currentRound += 1;
            // pick first guesser
            clients.forEach(client => client.isGuessing = false)
            clients[0].isGuessing = true;
            console.info(`[INFO] Next Round in ${this.roomId} Round:${gameState.currentRound} of ${gameState.maxRounds}`);
            this.startHintTimeout()
        }
        this.showGameState();
    }

    gameOver() {
        console.info(`[GAME OVER] The game has ended in ${this.roomId}`);
        this.io.to(this.roomId).emit('game-over', "game Over")
        const {gameState, clients} = this.store;
        clients.forEach(client => client.isReady = false)
        gameState.inLobby = true;
        clearTimeout(this.store.guessTimeout)
        clearTimeout(this.store.hintTimeout)
        clearInterval(this.store.hintTimeoutCountdown)
        clearInterval(this.store.guessTimeoutCountdown)
    }

    revealHints(gameState) {
        const {turns, currentTurn} = gameState.rounds[gameState.currentRound];
        const turn = turns[currentTurn];
        console.info(`[INFO] All hints submitted revealing hints in ${this.roomId} for Round:${gameState.currentRound} Turn:${currentTurn}`);
        turn.reveal = true
    }

    onDisconnect() {
        this.socket.on("disconnect", () => {
            // remove from clients
            console.info(`[DISCONNECT] Client ${this.socket.id} Disconnected from ${this.roomId}`);
            this.store.clients = this.store.clients.filter(client => client.id !== this.socket.id)
            // when all players disconnected
            if (!this.store.clients.length) {
                console.info(`[GAME OVER] All players disconnected from ${this.roomId}`);
                this.gameOver()
            }
            this.showPlayers()
        })
    }

    startHintTimeout() {
        clearInterval(this.store.guessTimeoutCountdown)
        this.store.hintTimeout = setTimeout(() => {
            this.revealHints(this.store.gameState)
            this.startGuessTimeout()
            this.showGameState() // or just emit the reveal change
        }, this.store.gameState.hintTimeout)
        this.store.hintTimeoutCountdown = this.emitHintTimeoutCountdown()
    }

    startGuessTimeout() {
        clearInterval(this.store.hintTimeoutCountdown)
        this.store.guessTimeout = setTimeout(() => {
            this.nextTurn()
            this.showGameState() // or just emit the reveal change
        }, this.store.gameState.guessTimeout)
        this.store.guessTimeoutCountdown = this.emitGuessTimeoutCountdown()
    }

    emitHintTimeoutCountdown() {
        let countdown = this.store.gameState.hintTimeout / 1000;
        return setInterval(() => {
            countdown -= 1
            this.io.to(this.roomId).emit('hint-countdown', { countdown })
        }, 1000)

    }

    emitGuessTimeoutCountdown() {
        let countdown = this.store.gameState.guessTimeout / 1000;
        return setInterval(() => {
            countdown -= 1
            this.io.to(this.roomId).emit('guess-countdown', { countdown })
        }, 1000)

    }

    markDuplicates(hints) {
        hints.sort((a, b) => a.hint.localeCompare(b.hint)).forEach((hint, index, arr) => {
            if (index < arr.length-1 && hint.hint.toUpperCase() === arr[index + 1].hint.toUpperCase()) {
                hint.duplicate = true;
                arr[index +1].duplicate = true
            }
        })
    }
}

module.exports = Room;

