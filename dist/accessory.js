"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KefSpeakersAccessory = void 0;
const settings_1 = require("./settings");
const node_persist_1 = __importDefault(require("node-persist"));
class KefSpeakersAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.inputServices = [];
        this.pollingInterval = 2500;
        this.volumeStep = 3;
        this.state = {
            powerState: '0',
            changingPowerState: false,
            inputs: [],
            connectionError: false,
        };
        // set the AVR accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kef')
            .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.modelName || 'Unkown')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.serialNumber || 'Unknown')
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.firmwareVersion || 'Unknown');
        this.service = this.accessory.addService(this.platform.Service.Television);
        this.init();
        // Regularly ping the speakers to keep power/input state syncronised
        setInterval(this.getPowerState.bind(this, this.updateSpeakersState.bind(this)), this.pollingInterval);
    }
    async init() {
        try {
            try {
                await node_persist_1.default.init({
                    dir: this.platform.config.cacheDirectory || '../.node_persist',
                });
            }
            catch (err) {
                this.platform.log.error(`
          Could not create cache directory.
          Please check your Homebridge instance has permission to read/write to "${err.path}"
          or set a different cache directory using the "cacheDirectory" config property.
        `);
            }
            await this.createTVService();
            await this.createTVSpeakerService();
            await this.createInputSourceServices();
            // Wait for all services to be created before publishing
            this.platform.api.publishExternalAccessories(settings_1.PLUGIN_NAME, [this.accessory]);
        }
        catch (err) {
            this.platform.log.error(err);
        }
    }
    async createTVService() {
        // Set Television Service Name & Discovery Mode
        this.service
            .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.accessory.context.device.displayName)
            .setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        // Power State Get/Set
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));
        // Input Source Get/Set
        this.service
            .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('get', this.getInputSource.bind(this))
            .on('set', this.setInputSource.bind(this));
        // Remote Key Set
        this.service.getCharacteristic(this.platform.Characteristic.RemoteKey)
            .on('set', (newValue, callback) => {
            switch (newValue) {
                case this.platform.Characteristic.RemoteKey.REWIND:
                    this.platform.log.info('set Remote Key Pressed: REWIND');
                    this.sendPlayerCommand('previous', callback);
                    callback(null);
                    break;
                case this.platform.Characteristic.RemoteKey.FAST_FORWARD:
                    this.platform.log.info('set Remote Key Pressed: FAST_FORWARD');
                    this.sendPlayerCommand('next', callback);
                    callback(null);
                    break;
                case this.platform.Characteristic.RemoteKey.NEXT_TRACK:
                    this.platform.log.info('set Remote Key Pressed: NEXT_TRACK');
                    this.sendPlayerCommand('next', callback);
                    break;
                case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK:
                    this.platform.log.info('set Remote Key Pressed: NEXT_TRACK');
                    this.sendPlayerCommand('previous', callback);
                    break;
                case this.platform.Characteristic.RemoteKey.ARROW_UP:
                    this.platform.log.info('set Remote Key Pressed: ARROW_UP');
                    this.selectVolume(0, callback);
                    break;
                case this.platform.Characteristic.RemoteKey.ARROW_DOWN:
                    this.platform.log.info('set Remote Key Pressed: ARROW_DOWN');
                    this.selectVolume(1, callback);
                    break;
                case this.platform.Characteristic.RemoteKey.ARROW_LEFT:
                    this.platform.log.info('set Remote Key Pressed: ARROW_LEFT');
                    this.sendPlayerCommand('previous', callback);
                    break;
                case this.platform.Characteristic.RemoteKey.ARROW_RIGHT:
                    this.platform.log.info('set Remote Key Pressed: ARROW_RIGHT');
                    this.sendPlayerCommand('next', callback);
                    break;
                case this.platform.Characteristic.RemoteKey.SELECT:
                    this.platform.log.info('set Remote Key Pressed: SELECT');
                    this.sendPlayerCommand('pause', callback);
                    break;
                case this.platform.Characteristic.RemoteKey.BACK:
                    this.platform.log.info('set Remote Key Pressed: BACK');
                    this.selectInputSource(1, callback);
                    break;
                case this.platform.Characteristic.RemoteKey.EXIT:
                    this.platform.log.info('set Remote Key Pressed: EXIT');
                    this.sendPlayerCommand('pause', callback);
                    break;
                case this.platform.Characteristic.RemoteKey.PLAY_PAUSE:
                    this.platform.log.info('set Remote Key Pressed: PLAY_PAUSE');
                    this.sendPlayerCommand('pause', callback);
                    break;
                case this.platform.Characteristic.RemoteKey.INFORMATION:
                    this.platform.log.info('set Remote Key Pressed: INFORMATION');
                    this.selectInputSource(0, callback);
                    break;
                default:
                    this.platform.log.info('unhandled Remote Key Pressed');
                    callback(null);
                    break;
            }
        });
        return;
    }
    async createTVSpeakerService() {
        const tvSpeakerService = this.accessory.addService(this.platform.Service.TelevisionSpeaker);
        tvSpeakerService
            .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);
        // Handle volume control
        tvSpeakerService.getCharacteristic(this.platform.Characteristic.VolumeSelector)
            .on('set', (direction, callback) => {
            this.selectVolume(direction, callback);
        });
        // Handle volume
        tvSpeakerService.getCharacteristic(this.platform.Characteristic.Volume)
            .on('set', (value, callback) => {
            this.setVolume(value, callback);
        }).on('get', (callback) => {
            this.getVolume(callback);
        });
        // Create handlers for mute
        tvSpeakerService.getCharacteristic(this.platform.Characteristic.Mute)
            .on('set', (callback) => {
            this.setMute(callback);
        }).on('get', (callback) => {
            this.getMute(callback);
        });
        return;
    }
    updateSpeakersState(_error, status) {
        this.service.updateCharacteristic(this.platform.Characteristic.Active, status);
        this.platform.KefAPI.getInputSource()
            .then(async (source) => {
            const index = this.state.inputs.findIndex(input => input.id === source);
            this.service.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, index === -1 ? 0 : index // Fallback to first source,
            );
            if (this.state.connectionError) {
                this.state.connectionError = false;
                this.platform.log.info(`Communication with Kef Speakers at ${this.platform.config.ip} restored`);
            }
            return;
        })
            .catch(() => {
            if (this.state.connectionError) {
                return;
            }
            this.state.connectionError = true;
            this.platform.log.error(`
          Cannot communicate with Kef Speakers at ${this.platform.config.ip}.
          Connection will be restored automatically when the speakers begins responding.
        `);
        });
    }
    getPowerState(callback) {
        if (this.state.changingPowerState) {
            callback(null, this.state.powerState);
        }
        else {
            this.platform.KefAPI.isOn()
                .then(result => {
                this.state.powerState = result;
                callback(null, result);
            })
                .catch(error => {
                callback(error, false);
            });
        }
    }
    setPowerState(state, callback) {
        this.state.changingPowerState = true;
        this.state.powerState = state;
        if (state) {
            this.platform.log.info('Power On');
            this.platform.KefAPI.powerOn();
            // Worst case scenario takes 10 seconds to power on
            setTimeout(() => {
                this.state.changingPowerState = false;
            }, 10000);
        }
        else {
            this.platform.log.info('Power Off');
            this.platform.KefAPI.powerOff();
            // Power off takes about 5 seconds
            setTimeout(() => {
                this.state.changingPowerState = false;
            }, 5000);
        }
        callback(null);
    }
    selectVolume(direction, callback) {
        this.platform.KefAPI.getVolume()
            .then(volume => {
            const newVolume = parseInt(volume);
            if (direction === 0) {
                const newVolume = parseInt(volume) + this.volumeStep;
                this.platform.log.info('Volume Up: ', (newVolume));
                this.platform.KefAPI.setVolume(newVolume);
            }
            else {
                const newVolume = parseInt(volume) - this.volumeStep;
                this.platform.log.info('Volume Down: ', (newVolume));
                this.platform.KefAPI.setVolume(newVolume);
            }
            callback(null);
        })
            .catch(error => {
            callback(error, false);
        });
    }
    setVolume(volume, callback) {
        this.platform.KefAPI.setVolume(volume)
            .then(() => {
            this.platform.log.info(`Setting volume: ${volume}`);
            callback(null);
        })
            .catch(error => {
            callback(error, false);
        });
    }
    getVolume(callback) {
        this.platform.KefAPI.getVolume()
            .then(volume => {
            this.platform.log.debug(`Current volume: ${volume}`);
            callback(null, parseInt(volume));
        })
            .catch(error => {
            callback(error, false);
        });
    }
    getMute(callback) {
        this.platform.KefAPI.getVolume()
            .then(volume => {
            this.platform.log.debug(`Is muted: ${parseInt(volume) === 0}`);
            callback(null, parseInt(volume) === 0);
        })
            .catch(error => {
            callback(error, false);
        });
    }
    setMute(callback) {
        this.platform.KefAPI.setVolume(0)
            .then(volume => {
            this.platform.log.info('Setting mute');
            callback(null);
        })
            .catch(error => {
            callback(error, false);
        });
    }
    sendPlayerCommand(command, callback) {
        this.platform.KefAPI.sendPlayerCommand(command)
            .then(() => {
            callback(null);
        });
    }
    selectInputSource(direction, callback) {
        this.platform.KefAPI.getInputSource()
            .then(currentSource => {
            const currentInput = this.state.inputs.find(input => input.id === currentSource);
            const visibleInputs = this.state.inputs.filter(input => input.visible);
            let currentIndex = -1;
            if (currentInput) {
                currentIndex = visibleInputs.indexOf(currentInput);
            }
            if (direction === 0) {
                const nextInput = visibleInputs[currentIndex + 1];
                if (nextInput) {
                    return this.setInputSource(nextInput.index, callback);
                }
            }
            else {
                const nextInput = visibleInputs[currentIndex - 1];
                if (nextInput) {
                    return this.setInputSource(nextInput.index, callback);
                }
            }
            callback(null);
        })
            .catch(error => {
            callback(error, false);
        });
    }
    getInputSource(callback) {
        this.platform.KefAPI.getInputSource()
            .then(source => {
            const currentSource = source === 'standby' ? 'wifi' : source;
            const input = this.state.inputs.find(input => input.id === currentSource);
            this.platform.log.debug(`Current input: ${currentSource}`);
            if (!input) {
                this.platform.log.debug(`Could not get input: ${currentSource}`);
                return; //callback(null, 0);
            }
            this.platform.log.info(`Current input: ${input.name} (${input.id})`);
            return callback(null, input.index);
        });
    }
    setInputSource(inputIdentifier, callback) {
        const input = this.state.inputs[Number(inputIdentifier)];
        this.platform.log.info(`Set input: ${input.name} (${input.id})`);
        this.platform.KefAPI.setInputSource(input.id);
        callback(null);
    }
    setInputSources() {
        const allInputs = this.accessory.context.inputs;
        this.state.inputs = [];
        allInputs.forEach((source, index) => {
            // Already in state, do we need this?
            if (this.state.inputs.find(input => input.id == source)) {
                return;
            }
            this.state.inputs.push({
                id: source,
                name: source.toUpperCase(),
                index: index,
                visible: true
            });
        });
    }
    async createInputSourceServices() {
        this.setInputSources();
        return new Promise((resolve, reject) => {
            this.state.inputs.forEach(async (input, i) => {
                let cachedService;
                try {
                    cachedService = await node_persist_1.default.getItem(`input_${i}`);
                }
                catch (err) {
                    reject(`
            Could not access cache.
            Please check your Homebridge instance has permission to access "${this.platform.config.cacheDirectory}"
            or set a different cache directory using the "cacheDirectory" config property.
          `);
                }
                if (cachedService) {
                    input.visible = cachedService.CurrentVisibilityState === 0;
                }
                try {
                    const inputService = this.accessory.addService(this.platform.Service.InputSource, this.platform.api.hap.uuid.generate(input.id), input.name);
                    inputService
                        .setCharacteristic(this.platform.Characteristic.Identifier, i)
                        .setCharacteristic(this.platform.Characteristic.Name, input.name)
                        .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                        .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN)
                        .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.APPLICATION)
                        .setCharacteristic(this.platform.Characteristic.InputDeviceType, this.platform.Characteristic.InputDeviceType.TV);
                    inputService.getCharacteristic(this.platform.Characteristic.ConfiguredName)
                        .on('set', (name, callback) => {
                        this.platform.log.debug(`Set input (${input.id}) name to ${name}`);
                        inputService.updateCharacteristic(this.platform.Characteristic.ConfiguredName, name);
                        if ((cachedService === null || cachedService === void 0 ? void 0 : cachedService.ConfiguredName) !== name) {
                            node_persist_1.default.setItem(`input_${i}`, {
                                ConfiguredName: name,
                                CurrentVisibilityState: inputService.getCharacteristic(this.platform.Characteristic.CurrentVisibilityState).value,
                            });
                        }
                        callback(null);
                    });
                    inputService.getCharacteristic(this.platform.Characteristic.TargetVisibilityState)
                        .on('set', (targetVisibilityState, callback) => {
                        this.platform.log.debug(`
                Set input (${input.id}) visibility state to
                ${targetVisibilityState === this.platform.Characteristic.TargetVisibilityState.HIDDEN ? 'HIDDEN' : 'SHOWN'}
              `);
                        inputService.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, targetVisibilityState);
                        if ((cachedService === null || cachedService === void 0 ? void 0 : cachedService.CurrentVisibilityState) !== targetVisibilityState) {
                            if (cachedService) {
                                input.visible = targetVisibilityState === 0;
                            }
                            node_persist_1.default.setItem(`input_${i}`, {
                                ConfiguredName: inputService.getCharacteristic(this.platform.Characteristic.ConfiguredName).value,
                                CurrentVisibilityState: targetVisibilityState,
                            });
                        }
                        callback(null);
                    });
                    inputService.getCharacteristic(this.platform.Characteristic.Name)
                        .on('get', callback => callback(null, input.name));
                    if (cachedService) {
                        if (this.platform.Characteristic.CurrentVisibilityState.SHOWN !== cachedService.CurrentVisibilityState) {
                            this.platform.log.debug(`Restoring input ${input.id} visibility state from cache`);
                            inputService
                                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, cachedService.CurrentVisibilityState);
                        }
                        if (input.name !== cachedService.ConfiguredName) {
                            this.platform.log.debug(`Restoring input ${input.id} configured name from cache`);
                            inputService
                                .setCharacteristic(this.platform.Characteristic.ConfiguredName, cachedService.ConfiguredName);
                        }
                    }
                    this.service.addLinkedService(inputService);
                    this.inputServices.push(inputService);
                    try {
                        // Cache Data
                        await node_persist_1.default.setItem(`input_${i}`, {
                            ConfiguredName: inputService.getCharacteristic(this.platform.Characteristic.ConfiguredName).value,
                            CurrentVisibilityState: inputService.getCharacteristic(this.platform.Characteristic.CurrentVisibilityState).value,
                        });
                        if (this.inputServices.length === this.state.inputs.length) {
                            resolve(null);
                        }
                    }
                    catch (err) {
                        reject(`
              Could not write to cache.
              Please check your Homebridge instance has permission to write to
              "${this.platform.config.cacheDirectory}"
              or set a different cache directory using the "cacheDirectory" config property.
            `);
                    }
                }
                catch (err) {
                    this.platform.log.error(`
            Failed to add input service ${input.name}:
            ${err}
          `);
                }
            });
        });
    }
}
exports.KefSpeakersAccessory = KefSpeakersAccessory;
//# sourceMappingURL=accessory.js.map