const axios = require("axios");
const moment = require("moment");
const TuyaClient = require("../tuya");

class FreeGame {
    #game = {};
    #gameId = 0;
    #gameTime = moment();
    #status = 0;
    #scoreLine = "";
    #isStarted = false;

    #tuya = new TuyaClient();
    #awayScore = 0;
    #initialAwayScore = 0;
}