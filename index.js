require("dotenv").config();

const TuyaClient = require("./lib/tuya");
const Game = require("./lib/nhl/Game");
const teams = require("./teams.json");

const tuya = new TuyaClient(
    process.env.TUYA_CLIENT_ID,
    process.env.TUYA_CLIENT_SECRET,
    process.env.TUYA_USER_ID,
    process.env.TUYA_REGION || "USAW"
);

const inquirer = require("inquirer");

tuya.init().then(() => {
    inquirer.prompt([
        {
            type: "confirm",
            name: "freeGame",
            message: "Is this a free game? (No team selection)",
            default: false
        },
        {
            type: "list",
            name: "team",
            message: "Select Team",
            choices: teams
        }
    ]).then(answers => {
        new Game(tuya, answers.team);
    });
}).catch(err => {
    console.error(err);
});