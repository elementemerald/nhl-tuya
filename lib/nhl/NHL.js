class NHL {
    #team = {};

    constructor(team) {
        this.#team = team;
    }

    getTeam() {
        return this.#team;
    }
}

module.exports = NHL;