const TuyaAPI = require("./api");

class TuyaClient extends TuyaAPI {
    constructor(clientId, clientSecret, userId, region) {
        super(clientId, clientSecret, userId, region);
    }

    async init() {
        return new Promise((resolve, reject) => {
            super.init().then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    async deviceOnline(deviceId) {
        return new Promise((resolve, reject) => {
            this.getDeviceInfo(deviceId).then(data => {
                resolve(data.result.online);
            }).catch(_ => {
                reject(false);
            });
        })
    }

    async toggleDevice(deviceId, toggle) {
        return this.sendCommands(deviceId, [
            {
                code: "switch_led",
                value: toggle
            }
        ]);
    }

    async setDeviceMode(deviceId, mode) {
        return this.sendCommands(deviceId, [
            {
                code: "work_mode",
                value: mode
            }
        ]);
    }

    toHSL(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    
        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);
    
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
    
        if(max == min){
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
    
        s = s*1000;
        s = Math.round(s);
        l = l*1000;
        l = Math.round(l);
        h = Math.round(h*360);
    
        return [h, s, l];
    }

    async setDeviceColor(deviceId, hex) {
        return this.sendCommands(deviceId, [
            {
                code: "work_mode",
                value: "colour"
            },
            {
                code: "colour_data_v2",
                value: JSON.stringify({
                    h: h,
                    s: s,
                    v: l
                })
            }
        ]);
    }

    async setDeviceScene(deviceId, scene) {
        return this.sendCommands(deviceId, [
            {
                code: "work_mode",
                value: "scene"
            },
            {
                code: "scene_data_v2",
                value: scene
            }
        ]);
    }
}

module.exports = TuyaClient;