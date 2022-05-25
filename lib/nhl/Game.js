const axios = require("axios");
const moment = require("moment");

class Game extends NHL {
    #game = {};
    #gameId = 0;
    #gameTime = moment();
    #status = 0;
    #puckInPlay = false;
    #scoreLine = "";
    #home = false;

    #score = 0;
    #initialScore = 0;

    constructor(team) {
        super(team);
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

    watch() {
        
    }
}