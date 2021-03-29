"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KefPlatform = void 0;
const kef_1 = __importDefault(require("./kef"));
const accessory_1 = require("./accessory");
class KefPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.KefAPI = new kef_1.default(this.config.ip);
        this.log.debug('Finished initializing platform:', this.config.name);
        this.api.on('didFinishLaunching', () => {
            this.KefAPI.catchRequestErrors = false;
            this.discoverSpeakers();
        });
    }
    discoverSpeakers() {
        this.KefAPI.getSystemConfig()
            .then(systemConfig => {
            const config = {
                serialNumber: systemConfig.serialNumber,
                modelName: systemConfig.modelName,
                firmwareVersion: systemConfig.firmwareVersion,
            };
            const inputs = systemConfig.inputs;
            const device = {
                UUID: this.api.hap.uuid.generate(`${config.serialNumber}_1`),
                displayName: this.config.name ? this.config.name : 'Kef Speakers',
            };
            const accessory = new this.api.platformAccessory(device.displayName, device.UUID, 34 /* AUDIO_RECEIVER */);
            accessory.context = {
                ...config,
                inputs,
                device,
            };
            new accessory_1.KefSpeakersAccessory(this, accessory);
        })
            .catch(() => {
            this.log.error(`
          Failed to get system config from ${this.config.name}. Please verify the Speakers are connected and accessible at ${this.config.ip}
        `);
        });
    }
}
exports.KefPlatform = KefPlatform;
//# sourceMappingURL=platform.js.map