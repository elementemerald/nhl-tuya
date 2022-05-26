const axios = require("axios");
const regions = require("../regions");
const CryptoJS = require("crypto-js");

class TuyaAPI {
    #debug = process.env.TUYA_DEBUG || true;
    #clientId = "";
    #clientSecret = "";
    #userId = "";
    #region = "";
    #accessToken = "";
    #refreshToken = "";

    #getRanHex = size => {
        let result = [];
        let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
        
        for (let n = 0; n < size; n++) {
            result.push(hexRef[Math.floor(Math.random() * 16)]);
        }
        return result.join('');
    }

    #handleToken(res) {
        this.#accessToken = res.data.result.access_token;
        this.#refreshToken = res.data.result.refresh_token;

        setInterval(this.refreshAccess, res.data.result.expire_time * 1000);
    }

    constructor(clientId, clientSecret, userId, region) {
        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
        this.#userId = userId;
        this.#region = region;
    }

    async init() {
        const regionObj = regions[this.#region];
        if (!regionObj) throw new Error("Region does not exist");

        return new Promise((resolve, reject) => {
            const timestamp = new Date().getTime();

            const nonceLength = Math.random() * (40 - 25) + 25;
            const nonce = this.#getRanHex(nonceLength);

            const contentHash = CryptoJS.SHA256("").toString();
            const stringToSignToken = ["GET", contentHash, "", "/v1.0/token?grant_type=1"].join("\n");
            const str = this.#clientId + timestamp + nonce + stringToSignToken;

            const hash = CryptoJS.HmacSHA256(str, this.#clientSecret).toString().toUpperCase();

            axios.default.get(regionObj.endpoint + "/v1.0/token?grant_type=1", {
                headers: {
                    client_id: this.#clientId,
                    sign: hash,
                    sign_method: "HMAC-SHA256",
                    t: timestamp,
                    nonce: nonce
                }
            }).then(function (res) {
                this.#handleToken(res);
                resolve();
            }.bind(this)).catch(err => {
                reject(err);
            });
        });
    }

    refreshAccess() {
        const regionObj = regions[this.#region];
        if (!regionObj) throw new Error("Region does not exist");

        const timestamp = new Date().getTime();

        const nonceLength = Math.random() * (25 - 15) + 15;
        const nonce = this.#getRanHex(nonceLength);

        const contentHash = CryptoJS.SHA256("").toString();
        const stringToSign = ["GET", contentHash, "", `/v1.0/token/${this.#refreshToken}`].join("\n");
        const str = this.#clientId + timestamp + nonce + stringToSign;

        const hash = CryptoJS.HmacSHA256(str, this.#clientSecret).toString().toUpperCase();

        if (this.#debug) console.log(`[TUYA] Hashed signature (refreshAccess) - ${hash}`);

        axios.default.get(regionObj.endpoint + `/v1.0/token/${this.#refreshToken}`, {
            headers: {
                client_id: this.#clientId,
                sign: hash,
                sign_method: "HMAC-SHA256",
                t: timestamp,
                nonce: nonce
            }
        }).then(res => {
            console.log(res.data);
        }).catch(err => {
            console.error(err);
        });
    }

    async getDeviceList() {
        const regionObj = regions[this.#region];
        if (!regionObj) throw new Error("Region does not exist");

        return new Promise((resolve, reject) => {
            const timestamp = new Date().getTime();

            const nonceLength = Math.random() * (40 - 25) + 25;
            const nonce = this.#getRanHex(nonceLength);

            const contentHash = CryptoJS.SHA256("").toString();
            const stringToSign = ["GET", contentHash, "", `/v1.0/users/${this.#userId}/devices`].join("\n");
            const str = this.#clientId + this.#accessToken + timestamp + nonce + stringToSign;

            const hash = CryptoJS.HmacSHA256(str, this.#clientSecret).toString().toUpperCase();

            if (this.#debug) console.log(`[TUYA] Hashed signature (getDeviceList) - ${hash}`);

            axios.default.get(regionObj.endpoint + `/v1.0/users/${this.#userId}/devices`, {
                headers: {
                    client_id: this.#clientId,
                    access_token: this.#accessToken,
                    sign: hash,
                    sign_method: "HMAC-SHA256",
                    t: timestamp,
                    nonce: nonce
                }
            }).then(res => {
                res.data.success ? resolve(res.data) : reject(res.data.msg);
            }).catch(err => {
                reject(err);
            });
        });
    }

    async getDeviceInfo(deviceId) {
        const regionObj = regions[this.#region];
        if (!regionObj) throw new Error("Region does not exist");

        return new Promise((resolve, reject) => {
            const infoTimestamp = new Date().getTime();

            const infoNonceLength = Math.random() * (40 - 30) + 30;
            const infoNonce = this.#getRanHex(infoNonceLength);

            const infoContentHash = CryptoJS.SHA256("").toString();
            const infoStringToSign = ["GET", infoContentHash, "", `/v1.0/devices/${deviceId}`].join("\n");
            const infoStr = this.#clientId + this.#accessToken + infoTimestamp + infoNonce + infoStringToSign;

            const infoHash = CryptoJS.HmacSHA256(infoStr, this.#clientSecret).toString().toUpperCase();

            if (this.#debug) console.log(`[TUYA] Hashed signature (getDeviceInfo) - ${infoHash}`);

            axios.default.get(regionObj.endpoint + `/v1.0/devices/${deviceId}`, {
                headers: {
                    client_id: this.#clientId,
                    access_token: this.#accessToken,
                    sign: infoHash,
                    sign_method: "HMAC-SHA256",
                    t: infoTimestamp,
                    nonce: infoNonce
                }
            }).then(res => {
                res.data.success ? resolve(res.data) : reject(res.data.msg);
            }).catch(err => {
                reject(err);
            });
        });
    }

    async sendCommands(deviceId, commands) {
        const regionObj = regions[this.#region];
        if (!regionObj) throw new Error("Region does not exist");

        return new Promise((resolve, reject) => {
            const timestamp = new Date().getTime();

            const nonceLength = Math.random() * (40 - 35) + 35;
            const nonce = this.#getRanHex(nonceLength);

            const body = JSON.stringify({
                commands: commands
            });

            const contentHash = CryptoJS.SHA256(body).toString();
            const stringToSign = ["POST", contentHash, "", `/v1.0/devices/${deviceId}/commands`].join("\n");
            const str = this.#clientId + this.#accessToken + timestamp + nonce + stringToSign;

            const hash = CryptoJS.HmacSHA256(str, this.#clientSecret).toString();

            axios.default.post(regionObj.endpoint + `/v1.0/devices/${deviceId}/commands`, body, {
                headers: {
                    "Content-Type": "application/json",
                    client_id: this.#clientId,
                    access_token: this.#accessToken,
                    sign: hash.toUpperCase(),
                    sign_method: "HMAC-SHA256",
                    t: timestamp,
                    nonce: nonce
                }
            }).then(res => {
                res.data.success ? resolve(true) : reject(res.data);
            }).catch(err => {
                reject(err);
            });
        });
    }
}

module.exports = TuyaAPI;