class NHL {
    #team = {};
    #otherTeam = {};

    constructor(team) {
        this.#team = team;
    }

    getTeam() {
        return this.#team;
    }

    getOtherTeam() {
        return this.#otherTeam;
    }

    setOtherTeam(team) {
        this.#otherTeam = team;
    }
}

module.exports = NHL;