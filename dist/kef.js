"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
class KefAPI {
    constructor(ip) {
        this.catchRequestErrors = true;
        this.ip = ip;
    }
    getSystemConfig() {
        return new Promise((resolve, reject) => {
            // Features are hardcoded for now
            const inputs = [
                "wifi",
                "bluetooth",
                "tv",
                "optical",
                "coaxial",
                "analog"
            ];
            const systemConfig = {
                serialNumber: null,
                modelName: null,
                firmwareVersion: null,
                inputs
            };
            const modelNamePromise = this._getModelName().then((modelName) => {
                systemConfig.modelName = modelName;
            });
            const serialNumberPromise = this._getSerialNumber().then((serialNumber) => {
                systemConfig.serialNumber = serialNumber;
            });
            return Promise.all([modelNamePromise, serialNumberPromise]).then(() => {
                resolve(systemConfig);
            });
        });
    }
    isOn() {
        return new Promise((resolve, _reject) => {
            this._getData('roles=value&path=settings%3A%2Fkef%2Fhost%2FspeakerStatus').then((response) => {
                resolve(response[0].kefSpeakerStatus === 'standby' ? '0' : '1');
            });
        });
    }
    powerOn() {
        return this.setInputSource('wifi');
    }
    powerOff() {
        return this.setInputSource('standby');
    }
    getVolume() {
        return new Promise((resolve, _reject) => {
            this._getData("roles=value&path=player%3Avolume").then((response) => {
                resolve(response[0].i32_.toString());
            });
        });
    }
    setVolume(volume) {
        const data = {
            "path": "player:volume",
            "role": "value",
            "value": {
                "type": "i32_",
                "i32_": volume
            }
        };
        return new Promise((resolve, _reject) => {
            this._setData(data).then((response) => {
                resolve(null);
            });
        });
    }
    getInputSource() {
        return new Promise((resolve, _reject) => {
            this._getData("path=settings%3A%2Fkef%2Fplay%2FphysicalSource&roles=value").then((response) => {
                resolve(response[0].kefPhysicalSource);
            });
        });
    }
    setInputSource(source) {
        const data = {
            "path": "settings:/kef/play/physicalSource",
            "role": "value",
            "value": {
                "type": "kefPhysicalSource",
                "kefPhysicalSource": source
            }
        };
        return new Promise((resolve, _reject) => {
            this._setData(data).then((response) => {
                resolve(null);
            });
        });
    }
    sendPlayerCommand(command) {
        const data = {
            "path": "player:player/control",
            "role": "activate",
            "value": {
                "control": command
            }
        };
        return new Promise((resolve, _reject) => {
            this._setData(data).then(() => {
                resolve(null);
            });
        });
    }
    getPlayerState() {
        return new Promise((resolve, _reject) => {
            this._getData("roles=value&path=player%3Aplayer%2Fdata").then((response) => {
                const state = response[0].state || response[0].mediaRoles.state;
                switch (state) {
                    case 'playing':
                        resolve('0');
                        break;
                    case 'pauzed':
                        resolve('1');
                        break;
                    case 'stopped':
                        resolve('2');
                        break;
                    default:
                        resolve('4');
                        break;
                }
            });
        });
    }
    _getModelName() {
        return new Promise((resolve, _reject) => {
            this._getData("path=settings%3A%2Fkef%2Fhost%2FmodelName&roles=value").then((response) => {
                switch (response[0].string_) {
                    case 'SP4025':
                        resolve("LS50 Wireless II");
                        break;
                    default:
                        resolve(null);
                }
            });
        });
    }
    _getSerialNumber() {
        return new Promise((resolve, _reject) => {
            this._getData("roles=value&path=settings%3A%2Fkef%2Fhost%2FserialNumber").then((response) => {
                resolve(response[0].string_);
            });
        });
    }
    _getData(queryString) {
        return new Promise((resolve, _reject) => {
            return node_fetch_1.default(`http://${this.ip}/api/getData?${queryString}`).then(async (response) => {
                const text = await response.text();
                const json = JSON.parse(text);
                // console.log(text, json);
                resolve(json);
            });
        });
    }
    _setData(data) {
        const params = {
            method: 'post',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        };
        return new Promise((resolve, _reject) => {
            return node_fetch_1.default(`http://${this.ip}/api/setData`, params).then(async (response) => {
                const text = await response.text();
                const json = JSON.parse(text);
                // console.log(text, json);
                resolve(json);
            });
        });
    }
}
exports.default = KefAPI;
//# sourceMappingURL=kef.js.map