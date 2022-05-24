const axios = require("axios");
const regions = require("./regions");
const CryptoJS = require("crypto-js");

class TuyaClient {
    #clientId = "";
    #clientSecret = "";

    constructor(clientId, clientSecret, region) {
        const regionObj = regions[region];
        if (!regionObj) throw new Error("Region does not exist");

        this.#clientId = clientId;
        this.#clientSecret = clientSecret;

        const timestamp = new Date().getTime();

        axios.default.get(regionObj.endpoint + "/v1.0/token?grant_type=1", {
            headers: {
                client_id: clientId
            }
        })
    }
}

module.exports = TuyaClient;