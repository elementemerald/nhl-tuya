require("dotenv").config();

const TuyaClient = require("./lib/tuya");
const Game = require("./lib/nhl/Game");
const teams = require("./teams.json");

const tuya = new TuyaClient(
    process.env.TUYA_CLIENT_ID,
    process.env.TUYA_CLIENT_SECRET,
    process.env.TUYA_USER_ID,
    "USAW"
);

const inquirer = require("inquirer");

tuya.init().then(() => {
    inquirer.prompt([
        /* {
            type: "confirm",
            name: "freeGame",
            message: "Is this a free game? (No team selection)",
            default: false
        }, */
        {
            type: "list",
            name: "team",
            message: "Select Team",
            choices: teams
        }
    ]).then(answers => {
        new Game(tuya, answers.team);
    });
    /* inquirer.prompt([
        {
            type: "list",
            name: "team",
            message: "Select Team",
            choices: teams
        }
    ]).then(answers => {
        const team = answers.team;
        const [hPrimary, sPrimary, lPrimary] = tuya.toHSL(team.primaryColor);
        const [hSecondary, sSecondary, lSecondary] = tuya.toHSL(team.secondaryColor);

        tuya.getDeviceList().then(data => {
            const lights = data.result.filter(device => device.category == "dj");
            for (var i = 0; i < lights.length; i++) {
                const light = lights[i];
                tuya.setDeviceScene(light.id, {
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
                    setTimeout(tuya.setDeviceMode.bind(tuya), 20000, light.id, "white");
                }).catch(err => {
                    console.error(err);
                });
            }
        }).catch(err => {
            console.error(err);
        });
        new Game(tuya, answers.team);
    }); */
}).catch(err => {
    console.error(err);
});