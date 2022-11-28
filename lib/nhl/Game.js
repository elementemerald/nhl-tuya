const NHL = require("./NHL");

const axios = require("axios");
const moment = require("moment");
const TuyaClient = require("../tuya");
const teams = require("../../teams.json");

class Game extends NHL {
    #game = {};
    #gameId = 0;
    #gameTime = moment();
    #status = 0;
    #scoreLine = "";
    #home = false;
    #isStarted = false;
    #freeGame = false;

    #tuya = new TuyaClient();

    #score = 0;
    #initialScore = 0;
    #otherScore = 0;
    #otherInitialScore = 0;

    #puckInPlay = false;
    #beginningOfPeriod = false;
    #endOfPeriod = false;

    #initialIceTime = "";

    constructor(tuya, team, freeGame) {
        super(team);
        this.#tuya = tuya;
        this.#freeGame = freeGame;
        this.get().then(_ => {
            this.watch();
        });
    }

    start() {
        if (!this.#isStarted) {
            console.log("Starting");
            console.log(this.#scoreLine);
            this.#puckInPlay = false;
            this.#beginningOfPeriod = false;
            this.#endOfPeriod = false;
            this.#isStarted = true;
        }
    }

    #getIceTime(timeRemaining, currentPeriod) {
        let iceTime = "";

        // Todo: Add additional OT periods for playoffs
        if (timeRemaining == "END") {
            this.#puckInPlay = false;
            iceTime = timeRemaining + " of " + currentPeriod;
            if (!this.#endOfPeriod) {
                console.log(this.#scoreLine);
                this.#endOfPeriod = true;
            }
        } else if (timeRemaining == "20:00" || ((timeRemaining == "20:00" || timeRemaining == "05:00") && currentPeriod.includes("OT"))) {
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

    async get() {
        return new Promise((resolve, reject) => {
            const apiUrl = "https://statsapi.web.nhl.com/api/v1/schedule?teamId=" + this.getTeam()["id"] + "&expand=schedule.teams,schedule.linescore";
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
                    this.#otherScore = this.#home ? this.#game.linescore.teams.away.goals : this.#game.linescore.teams.home.goals;
                    this.#otherInitialScore = this.#otherScore;

                    const otherTeam = this.#home ? this.#game.teams.away.team.abbreviation : this.#game.teams.home.team.abbreviation;
                    const otherValue = teams.find(team => team.name === otherTeam);
                    if (!otherValue) {
                        reject("Could not find other team");
                        return;
                    }
                    this.setOtherTeam(otherValue.value);

                    resolve();
                }).catch(err => {
                    reject(err);
                });
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
                this.#scoreLine = this.#game.teams.away.team.name + " " + this.#game.linescore.teams.away.goals + " " + this.#game.teams.home.team.name + " " + this.#game.linescore.teams.home.goals;

                this.#score = this.#home ? this.#game.linescore.teams.home.goals : this.#game.linescore.teams.away.goals;
                this.#otherScore = this.#home ? this.#game.linescore.teams.away.goals : this.#game.linescore.teams.home.goals;
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

    async #activateLights(selected) {
        const team = selected ? this.getTeam() : this.getOtherTeam();
        const [hPrimary, sPrimary, lPrimary] = this.#tuya.toHSL(`#${team.primaryColor}`);
        const [hSecondary, sSecondary, lSecondary] = this.#tuya.toHSL(`#${team.secondaryColor}`);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.#tuya.getDeviceList()
                .then(data => {
                    const lights = data.result.filter(device => device.category == "dj");
                    for (var i = 0; i < lights.length; i++) {
                        const light = lights[i];
                        this.#tuya.setDeviceScene(light.id, {
                            "scene_num": 6,
                            "scene_units": [
                                {
                                    "unit_change_mode": "jump",
                                    "unit_switch_duration": 100,
                                    "unit_gradient_duration": 100,
                                    "h": hPrimary,
                                    "s": sPrimary,
                                    "v": 1000,
                                    "bright": 0,
                                    "temperature": 0
                                },
                                {
                                    "unit_change_mode": "jump",
                                    "unit_switch_duration": 100,
                                    "unit_gradient_duration": 100,
                                    "h": hSecondary,
                                    "s": sSecondary,
                                    "v": 1000,
                                    "bright": 0,
                                    "temperature": 0
                                }
                            ]
                        }).then(_ => {
                            setTimeout(this.#tuya.setDeviceMode.bind(this.#tuya), 20000, light.id, "white");
                            resolve(true);
                        }).catch(err => {
                            reject(err);
                        });
                    }
                });
            }, 3000);
        });
    }

    #watchScore() {
        const selectedScore = this.#score > this.#initialScore;
        const otherScore = this.#freeGame && (this.#otherScore > this.#otherInitialScore);
        if (selectedScore || otherScore) {
            console.log("GOAL");
            console.log(this.#scoreLine);

            /* this.#getCurrentPlay().then(currentPlay => {
                const currentPlayIceTime = currentPlay.about.periodTimeRemaining + " of " + currentPlay.about.ordinalNum;
                console.log("Time of Goal: " + currentPlayIceTime);

                this.#activateLights().then(_ => {
                    this.#initialScore = this.#score;
                }).catch(err => {
                    console.error(err);
                });
            }).catch(err => {
                console.error(err);
            }); */
            console.log("Time of Goal: " + this.#initialIceTime);

            this.#activateLights(selectedScore).then(_ => {
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
                    console.log(pauseTime);
                    await this.#wait(1000);
                }
            } else if (this.#status == 2) {
                const pregameTime = moment();
                console.log("Pregame - currently " + pregameTime.format("HH:mm:ss"));
                await this.#wait(30000);
            } else if (this.#status > 2 && this.#status < 6) {
                this.start();
                const iceTime = this.#getIceTime(this.#game.linescore.currentPeriodTimeRemaining, this.#game.linescore.currentPeriodOrdinal);

                if (iceTime != this.#initialIceTime) {
                    console.log(iceTime);
                    this.#initialIceTime = iceTime;
                }

                this.#watchScore();
                await this.#wait(10000);
            } else if (this.#status >= 6) {
                console.log("Game is over");
                console.log(this.#scoreLine);
                break;
            }

            await this.#wait(1);
        }
    }
}

module.exports = Game;