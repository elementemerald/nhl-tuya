require("dotenv").config();

const TuyaClient = require("./lib/tuya");
const tuya = new TuyaClient(
    process.env.TUYA_CLIENT_ID,
    process.env.TUYA_CLIENT_SECRET,
    process.env.TUYA_USER_ID,
    "USAW"
);
tuya.init().then(() => {
    tuya.getDeviceInfo("10470056cc50e35eb2bd").then(data => {
        console.log(data);
    }).catch(err => {
        console.error(err);
    });
}).catch(err => {
    console.error(err);
});