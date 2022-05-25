const axios = require("axios");
const moment = require("moment");
const TuyaClient = require("../tuya");

class Game extends NHL {
    #game = {};
    #gameId = 0;
    #gameTime = moment();
    #status = 0;
    #scoreLine = "";
    #home = false;
    #isStarted = false;

    #tuya = new TuyaClient();
    #score = 0;
    #initialScore = 0;

    #puckInPlay = false;
    #beginningOfPeriod = false;
    #endOfPeriod = false;

    constructor(tuya, team) {
        super(team);
        this.#tuya = tuya;
    }

    start() {
        if (!this.#isStarted) {
            console.log("Starting");
            console.log(this.#scoreLine);
            this.#puckInPlay = false;
            this.#beginningOfPeriod = false;
            this.#endOfPeriod = false;
        }
    }

    #getIceTime(timeRemaining, currentPeriod) {
        let iceTime = "";

        // Todo: Add additional OT periods for playoffs
        if (timeRemaining == "END") {
            this.#puckInPlay = false;
            iceTime = timeRemaining + " of " + currentPeriod;
            if (!this.#endOfPeriod)
                this.#endOfPeriod = true;
        } else if (timeRemaining == "20:00" || (timeRemaining == "05:00" && currentPeriod == "OT")) {
            this.#endOfPeriod = false;
            iceTime = "Start of " + currentPeriod;
            if (!this.#beginningOfPeriod)
                this.#beginningOfPeriod = true;
        } else if (timeRemaining == "Final") {
            this.#puckInPlay = false;
            iceTime = "Final";
        } else {
            iceTime = timeRemaining + " in " + currentPeriod;
            if (!this.#puckInPlay) { this.#puckInPlay = true; }
            this.#beginningOfPeriod = false;
            this.#endOfPeriod = false;
        }

        return iceTime;
    }

    #isHome() {
        return this.getTeam()["id"] == this.#game.teams.home.team.id;
    }

    get() {
        const apiUrl = "https://statsapi.web.nhl.com/api/v1/schedule?teamId=" + this.getTeam()["id"] + "&expand=schedule.linescore";
        axios.default.get(apiUrl)
            .then(res => {
                this.#game = res.data.dates[0].games[0];
                this.#gameId = this.#game.gamePk;
                this.#gameTime = moment(this.#game.gameDate);
                this.#status = this.#game.status.statusCode;
                this.#scoreLine = this.#game.teams.away.team.name + " " + this.#game.linescore.teams.away.goals + " " + this.#game.teams.home.team.name + " " + this.#game.linescore.teams.home.goals;
                this.#home = this.#isHome();

                this.#score = this.#home ? this.#game.linescore.teams.home.goals : this.#game.linescore.teams.away.goals;
                this.#initialScore = this.#score;
            });
    }

    update() {
        const apiUrl = "https://statsapi.web.nhl.com/api/v1/schedule?teamId=" + this.getTeam()["id"] + "&expand=schedule.linescore";
        axios.default.get(apiUrl)
            .then(res => {
                this.#game = res.data.dates[0].games[0];
                this.#gameId = this.#game.gamePk;
                this.#gameTime = moment(this.#game.gameDate);
                this.#status = this.#game.status.statusCode;

                this.#score = this.#home ? this.#game.linescore.teams.home.goals : this.#game.linescore.teams.away.goals;
            });
    }

    #wait(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    async #getCurrentPlay() {
        return new Promise((resolve, reject) => {
            const apiUrl = `https://statsapi.web.nhl.com/api/v1/game/${this.#gameId}/feed/live`;
            axios.default.get(apiUrl)
                .then(res => {
                    resolve(res.data.liveData.plays.currentPlay);
                }).catch(err => {
                    reject(err);
                });
        });
    }

    async #activateLights() {
        return new Promise((resolve, reject) => {
            this.#tuya.getDeviceList()
            .then(data => {
                const lights = data.result.filter(device => device.category == "dj");
                for (var i = 0; i < lights.length; i++) {
                    const light = lights[i];
                    this.#tuya.setDeviceColor(light.id, "#ff0000")
                        .then(_ => {
                            setTimeout(this.#tuya.setDeviceMode, 7000, light.id, "white");
                            resolve(true);
                        }).catch(err => {
                            reject(err);
                        });
                }
            })
        });
    }

    #watchScore() {
        if (this.#score > this.#initialScore) {
            console.log("GOAL");
            console.log(this.#scoreLine);

            const currentPlay = this.#getCurrentPlay();
            const currentPlayIceTime = currentPlay.about.periodTimeRemaining + " of " + currentPlay.about.ordinalNum;
            console.log("Time of Goal: " + currentPlayIceTime);

            this.#activateLights().then(_ => {
                this.#initialScore = this.#score;
            }).catch(err => {
                console.error(err);
            });
        }
    }

    async watch() {
        const currentTime = moment().utc();

        while (true) {
            this.update();

            if (this.#status < 2) {
                const pauseTime = moment.duration(this.#gameTime.diff(currentTime)).asSeconds();

                for (var i = 0; i < pauseTime; i++) {
                    pauseTime -= 1;
                    await this.#wait(1000);
                }
            } else if (this.#status == 2) {
                await this.#wait(30000);
            } else if (this.#status > 2 && this.#status < 6) {
                this.start();
                console.log(this.#getIceTime(this.#game.linescore.currentPeriodTimeRemaining, this.#game.linescore.currentPeriodOrdinal));
                this.#watchScore();
            } else if (this.#status >= 6) {
                console.log("Game is over");
                console.log(this.#scoreLine);
                break;
            }
        }
    }
}