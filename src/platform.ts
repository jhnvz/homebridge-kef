import { API, IndependentPlatformPlugin, Logger, PlatformConfig, Service, Characteristic } from 'homebridge';
import KefAPI from './kef';

import { KefSpeakersAccessory } from './accessory';

export class KefPlatform implements IndependentPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly KefAPI: KefAPI = new KefAPI(this.config.ip);

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      this.KefAPI.catchRequestErrors = false;
      this.discoverSpeakers();
    });
  }

  discoverSpeakers() {
    this.KefAPI.getSystemConfig()
      .then(
        systemConfig => {
          const config = {
            serialNumber: systemConfig.serialNumber,
            modelName: systemConfig.modelName,
            firmwareVersion: systemConfig.firmwareVersion,
          };

          const inputs = systemConfig.inputs;

          const device = {
            UUID: this.api.hap.uuid.generate(`${config.serialNumber}_7`),
            displayName: this.config.name ? this.config.name : 'Kef Speakers',
          };

          const accessory = new this.api.platformAccessory(
            device.displayName,
            device.UUID,
            this.api.hap.Categories.AUDIO_RECEIVER,
          );

          accessory.context = {
            ...config,
            inputs,
            device,
          };

          new KefSpeakersAccessory(this, accessory);
        },
      )
      .catch(() => {
        this.log.error(`
          Failed to get system config from ${this.config.name}. Please verify the Speakers are connected and accessible at ${this.config.ip}
        `);
      });
  }
}
