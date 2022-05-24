const axios = require("axios");
const regions = require("./regions");
const CryptoJS = require("crypto-js");

class TuyaClient {
    #clientId = "";
    #clientSecret = "";
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

    constructor(clientId, clientSecret, region) {
        const regionObj = regions[region];
        if (!regionObj) throw new Error("Region does not exist");

        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
        this.#region = region;

        const timestamp = new Date().getTime();

        const nonceLength = Math.random() * (40 - 25) + 25;
        const nonce = this.#getRanHex(nonceLength);

        const contentHash = CryptoJS.SHA256("").toString(CryptoJS.enc.Hex);
        const stringToSignToken = ["GET", contentHash, "", "/v1.0/token?grant_type=1"].join("\n");
        const str = clientId + timestamp + nonce + stringToSignToken;

        const hash = CryptoJS.HmacSHA256(str, clientSecret).toString();

        axios.default.get(regionObj.endpoint + "/v1.0/token?grant_type=1", {
            headers: {
                client_id: clientId,
                sign: hash.toUpperCase(),
                sign_method: "HMAC-SHA256",
                t: timestamp,
                nonce: nonce
            }
        }).then(res => {
            this.#accessToken = res.data.result.access_token;
            this.#refreshToken = res.data.result.refresh_token;

            setTimeout(this.#refreshAccess, res.data.result.expire_time * 1000);
        }).catch(err => {
            console.error(err);
        });
    }

    #refreshAccess() {
        const regionObj = regions[this.#region];
        if (!regionObj) throw new Error("Region does not exist");

        const timestamp = new Date().getTime();

        const nonceLength = Math.random() * (25 - 15) + 15;
        const nonce = this.#getRanHex(nonceLength);

        const contentHash = CryptoJS.SHA256("").toString(CryptoJS.enc.Hex);
        const stringToSign = ["GET", contentHash, "", `/v1.0/token/${this.#refreshToken}`].join("\n");
        const str = this.#clientId + timestamp + nonce + stringToSign;

        const hash = CryptoJS.HmacSHA256(str, this.#clientSecret).toString();

        axios.default.get(regionObj.endpoint + `/v1.0/token/${this.#refreshToken}`, {
            headers: {
                client_id: this.#clientId,
                sign: hash.toUpperCase(),
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

    getDeviceList() {

    }
}

module.exports = TuyaClient;