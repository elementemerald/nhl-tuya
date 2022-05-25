require("dotenv").config();

const TuyaClient = require("./lib/tuya");
const Game = require("./lib/nhl");

const tuya = new TuyaClient(
    process.env.TUYA_CLIENT_ID,
    process.env.TUYA_CLIENT_SECRET,
    process.env.TUYA_USER_ID,
    "USAW"
);

tuya.init().then(() => {
    tuya.getDeviceList().then(data => {
        const lights = data.result.filter(device => device.category == "dj");
        for (var i = 0; i < lights.length; i++) {
            const light = lights[i];
            console.log(light);
        }
    }).catch(err => {
        console.error(err);
    });
}).catch(err => {
    console.error(err);
});