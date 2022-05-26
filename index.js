require("dotenv").config();

const TuyaClient = require("./lib/tuya");
const Game = require("./lib/nhl");
const teams = require("./teams.json");

const tuya = new TuyaClient(
    process.env.TUYA_CLIENT_ID,
    process.env.TUYA_CLIENT_SECRET,
    process.env.TUYA_USER_ID,
    "USAW"
);

tuya.init().then(() => {
    /* tuya.getDeviceList().then(data => {
        const lights = data.result.filter(device => device.category == "dj");
        for (var i = 0; i < lights.length; i++) {
            const light = lights[i];
            tuya.setDeviceMode(light.id, "colour").then(_ => {
                setTimeout(tuya.setDeviceMode.bind(tuya), 10000, light.id, "white");
            }).catch(err => {
                console.error(err);
            });
        }
    }).catch(err => {
        console.error(err);
    }); */
    //new Game(tuya, teams.find(team => team.teamCity == "Colorado"));
}).catch(err => {
    console.error(err);
});