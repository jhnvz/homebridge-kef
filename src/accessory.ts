import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';
import { KefPlatform } from './platform';
import { PLUGIN_NAME } from './settings';
import storage from 'node-persist';

interface Input {
  id: string;
  name: string;
  index: number;
}

interface CachedServiceData {
  Identifier: number;
  CurrentVisibilityState: number;
  ConfiguredName: string;
}

export class KefSpeakersAccessory {
  private service: Service;
  // private fanService: Service;
  private inputServices: Service[] = [];

  private state = {
    isPlaying: true as boolean,
    inputs: [] as Input[],
    connectionError: false as boolean,
  };

  constructor(
    private readonly platform: KefPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set the AVR accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kef')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.modelName || 'Unkown')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.serialNumber || 'Unknown')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.firmwareVersion || 'Unknown');

    this.service = this.accessory.addService(this.platform.Service.Television);
    // this.fanService = this.accessory.addService(this.platform.Service.Fan);

    this.init();

    // regularly ping the Speakers to keep power/input state syncronised
    setInterval(
      this.getPowerState.bind(this, this.updateSpeakersState.bind(this)),
      5000,
    );
  }

  async init() {
    try {
      try {
        await storage.init({
          dir: this.platform.config.cacheDirectory || '../.node_persist',
        });
      } catch(err) {
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
      this.platform.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
    } catch(err) {
      this.platform.log.error(err);
    }
  }

  async createTVService() {
    // Set Television Service Name & Discovery Mode
    this.service
      .setCharacteristic(
        this.platform.Characteristic.ConfiguredName,
        this.accessory.context.device.displayName,
      )
      .setCharacteristic(
        this.platform.Characteristic.SleepDiscoveryMode,
        this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE,
      );

    // Power State Get/Set
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    // Input Source Get/Set
    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .on('get', this.getInputState.bind(this))
      .on('set', this.setInputState.bind(this));

    // Remote Key Set
    this.service.getCharacteristic(this.platform.Characteristic.RemoteKey)
      .on('set', (newValue, callback) => {
        switch(newValue) {
          // case this.platform.Characteristic.RemoteKey.REWIND:
          //   this.platform.log.info('set Remote Key Pressed: REWIND');
          //   this.platform.KefAPI.rewind();
          //   callback(null);
          //   break;

          // case this.platform.Characteristic.RemoteKey.FAST_FORWARD:
          //   this.platform.log.info('set Remote Key Pressed: FAST_FORWARD');
          //   this.platform.KefAPI.skip();
          //   callback(null);
          //   break;

          // case this.platform.Characteristic.RemoteKey.NEXT_TRACK:
          //   this.platform.log.info('set Remote Key Pressed: NEXT_TRACK');
          //   sendRemoteCode('7F016D92', callback);
          //   break;

          // case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK:
          //   this.platform.log.info('set Remote Key Pressed: PREVIOUS_TRACK');
          //   sendRemoteCode('7F016C93', callback);
          //   break;

          case this.platform.Characteristic.RemoteKey.ARROW_UP:
            this.platform.log.info('set Remote Key Pressed: ARROW_UP');
            this.selectInputState(1, callback);
            break;

          case this.platform.Characteristic.RemoteKey.ARROW_DOWN:
            this.platform.log.info('set Remote Key Pressed: ARROW_DOWN');
            this.selectInputState(0, callback);
            break;

          case this.platform.Characteristic.RemoteKey.ARROW_LEFT:
            this.platform.log.info('set Remote Key Pressed: ARROW_LEFT');
            this.selectVolume(1, callback);
            break;

          case this.platform.Characteristic.RemoteKey.ARROW_RIGHT:
            this.platform.log.info('set Remote Key Pressed: ARROW_RIGHT');
            this.selectVolume(0, callback);
            break;

          // case this.platform.Characteristic.RemoteKey.SELECT:
          //   this.platform.log.info('set Remote Key Pressed: SELECT');
          //   sendRemoteCode('7A85DE21', callback);
          //   break;

          // case this.platform.Characteristic.RemoteKey.BACK:
          //   this.platform.log.info('set Remote Key Pressed: BACK');
          //   sendRemoteCode('7A85AA55', callback);
          //   break;

          // case this.platform.Characteristic.RemoteKey.EXIT:
          //   this.platform.log.info('set Remote Key Pressed: EXIT');
          //   sendRemoteCode('7A85AA55', callback);
          //   break;

          // case this.platform.Characteristic.RemoteKey.PLAY_PAUSE:
          //   this.platform.log.info('set Remote Key Pressed: PLAY_PAUSE');
          //   if (this.state.isPlaying) {
          //     this.platform.KefAPI.pause();
          //     // this.sendRemoteCode('7F016798', callback);
          //   } else {
          //     this.platform.KefAPI.play();
          //     // this.sendRemoteCode('7F016897', callback);
          //   }

          //   this.state.isPlaying = !this.state.isPlaying;

          //   callback(null);

          //   break;

          // case this.platform.Characteristic.RemoteKey.INFORMATION:
          //   this.platform.log.info('set Remote Key Pressed: INFORMATION');
          //   sendRemoteCode('7A851F60', callback);
          //   break;

          default:
            this.platform.log.info('unhandled Remote Key Pressed');
            break;
        }

        callback(null)
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
      .on('set', (direction: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.selectVolume(direction, callback);
      });

    // Handle volume
    tvSpeakerService.getCharacteristic(this.platform.Characteristic.Volume)
      .on('set', (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.setVolume(value, callback);
      }).on('get', (callback: CharacteristicSetCallback) => {
        this.getVolume(callback);
      });

    // Create handlers for mute
    tvSpeakerService.getCharacteristic(this.platform.Characteristic.Mute)
      .on('set', (callback: CharacteristicSetCallback) => {
        this.setMute(callback);
      }).on('get', (callback: CharacteristicSetCallback) => {
        this.getMute(callback);
      });

    // Fan Service (as part of speaker)

    // // create handlers for required characteristics
    // this.fanService.getCharacteristic(this.platform.Characteristic.On)
    //   .on('get', this.getPowerState.bind(this))
    //   .on('set', this.setPowerState.bind(this));

    // // Handle volume
    // this.fanService.getCharacteristic(this.platform.Characteristic.RotationSpeed)
    //   .on('set', (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
    //     this.setVolume(value, callback);
    //   }).on('get', (callback: CharacteristicSetCallback) => {
    //     this.getVolume(callback);
    //   });

    return;
  }

  updateSpeakersState(_error, status) {
    this.service.updateCharacteristic(this.platform.Characteristic.Active, status);

    this.platform.KefAPI.getInputSource()
      .then(async (source) => {
        const index = this.state.inputs.findIndex(input => input.id === source)

        this.service.updateCharacteristic(
          this.platform.Characteristic.ActiveIdentifier,
          index === -1 ? 0 : index,
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

  getPowerState(callback: CharacteristicGetCallback) {
    this.platform.KefAPI.isOn()
      .then(result => {
        callback(null, result);
      })
      .catch(error => {
        callback(error, false);
      });
  }

  setPowerState(state: CharacteristicValue, callback: CharacteristicSetCallback) {
    if (state) {
      this.getPowerState((_, on) => {
        if (on == '0') {
          this.platform.log.info('Power On');
          this.platform.KefAPI.powerOn();
        }
      });
    } else {
      this.platform.log.info('Power Off');
      this.platform.KefAPI.powerOff();
    }

    callback(null);
  }

  selectVolume(direction: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.KefAPI.getVolume()
      .then(volume => {
        const newVolume = parseInt(volume)

        if (direction === 0) {
          this.platform.log.info('Volume Up: ', (newVolume + 5));
          this.platform.KefAPI.setVolume(newVolume + 5);
        } else {
          this.platform.log.info('Volume Down: ', (newVolume - 5));
          this.platform.KefAPI.setVolume(newVolume - 5);
        }

        callback(null);
      })
      .catch(error => {
        callback(error, false);
      });
  }

  setVolume(volume: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.KefAPI.setVolume(volume)
      .then(() => {
        this.platform.log.info(`Setting volume: ${volume}`, );
        callback(null)
      })
      .catch(error => {
        callback(error, false);
      });
  }

  getVolume(callback: CharacteristicSetCallback) {
    this.platform.KefAPI.getVolume()
      .then(volume => {
        this.platform.log.debug(`Current volume: ${volume}`);
        callback(null, parseInt(volume))
      })
      .catch(error => {
        callback(error, false);
      });
  }

  getMute(callback: CharacteristicSetCallback) {
    this.platform.KefAPI.getVolume()
      .then(volume => {
        this.platform.log.debug(`Is muted: ${parseInt(volume) === 0}`);

        callback(null, parseInt(volume) === 0)
      })
      .catch(error => {
        callback(error, false);
      });
  }

  setMute(callback: CharacteristicSetCallback) {
    this.platform.KefAPI.setVolume(0)
      .then(volume => {
        this.platform.log.info('Setting mute');
        callback(null)
      })
      .catch(error => {
        callback(error, false);
      });
  }

  selectInputState(direction: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.KefAPI.getInputSource()
      .then(currentSource => {
        const currentInput = this.state.inputs.find(input => input.id === currentSource);
        const currentIndex = currentInput ? currentInput.index : -1

        if (direction === 0) {
          const nextInput = this.state.inputs.find(input => input.index === currentIndex + 1);

          this.setInputState(nextInput?.index || this.state.inputs.length, callback)
        } else {
          const nextInput = this.state.inputs.find(input => input.index === currentIndex - 1);

          this.setInputState(nextInput?.index || 0, callback)
        }

        callback(null);
      })
      .catch(error => {
        callback(error, false);
      });
  }

  getInputState(callback: CharacteristicGetCallback) {
    this.platform.KefAPI.getInputSource()
      .then(source => {
        const currentSource = source === 'standby' ? 'wifi' : source

        const input: Input | undefined = this.state.inputs.find(input => input.id === currentSource);

        this.platform.log.debug(`Current input: ${currentSource}`);

        if (!input) {
          return;
        }

        this.platform.log.info(`Current input: ${input.name} (${input.id})`);

        this.state.inputs.filter((input, index) => {
          if (input.id === source) {
            return callback(null, index);
          }

          return;
        });
      });
  }

  setInputState(inputIdentifier: CharacteristicValue, callback: CharacteristicSetCallback) {
    const input: Input = this.state.inputs[Number(inputIdentifier)];
    this.platform.log.info(`Set input: ${input.name} (${input.id})`);
    this.platform.KefAPI.setInputSource(input.id);
    callback(null);
  }

  setInputSources() {
    const allInputs = this.accessory.context.inputs;
    this.state.inputs = [];

    allInputs.forEach((feature, index) => {
      // Already in state, do we need this?
      if (this.state.inputs.find(input => input.id == feature)) {
        return
      }

      this.state.inputs.push({
        id: feature,
        name: feature.toUpperCase(), // Humanize me
        index: index
      });
    });
  }

  async createInputSourceServices() {
    this.setInputSources();

    return new Promise<null>((resolve, reject) => {
      this.state.inputs.forEach(async (input, i) => {
        let cachedService: CachedServiceData | undefined;

        try {
          cachedService = await storage.getItem(`input_${i}`);
        } catch(err) {
          reject(`
            Could not access cache.
            Please check your Homebridge instance has permission to access "${this.platform.config.cacheDirectory}"
            or set a different cache directory using the "cacheDirectory" config property.
          `);
        }

        try {
          const inputService = this.accessory.addService(
            this.platform.Service.InputSource,
            this.platform.api.hap.uuid.generate(input.id),
            input.name,
          );

          inputService
            .setCharacteristic(this.platform.Characteristic.Identifier, i)
            .setCharacteristic(this.platform.Characteristic.Name, input.name)
            .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(
              this.platform.Characteristic.CurrentVisibilityState,
              this.platform.Characteristic.CurrentVisibilityState.SHOWN,
            )
            .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.APPLICATION)
            .setCharacteristic(this.platform.Characteristic.InputDeviceType, this.platform.Characteristic.InputDeviceType.TV);

          inputService.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('set', (name, callback) => {
              this.platform.log.debug(`Set input (${input.id}) name to ${name}`);
              inputService.updateCharacteristic(this.platform.Characteristic.ConfiguredName, name);

              if (cachedService?.ConfiguredName !== name) {
                storage.setItem(`input_${i}`, {
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

              if (cachedService?.CurrentVisibilityState !== targetVisibilityState) {
                storage.setItem(`input_${i}`, {
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
            await storage.setItem(`input_${i}`, {
              ConfiguredName: inputService.getCharacteristic(this.platform.Characteristic.ConfiguredName).value,
              CurrentVisibilityState: inputService.getCharacteristic(this.platform.Characteristic.CurrentVisibilityState).value,
            });

            if (this.inputServices.length === this.state.inputs.length) {
              resolve(null);
            }
          } catch (err) {
            reject(`
              Could not write to cache.
              Please check your Homebridge instance has permission to write to
              "${this.platform.config.cacheDirectory}"
              or set a different cache directory using the "cacheDirectory" config property.
            `);
          }
        } catch (err) {
          this.platform.log.error(`
            Failed to add input service ${input.name}:
            ${err}
          `);
        }
      });
    });
  }
}
