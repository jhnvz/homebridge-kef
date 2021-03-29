import { PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';
import { KefPlatform } from './platform';
export declare class KefSpeakersAccessory {
    private readonly platform;
    private readonly accessory;
    private service;
    private inputServices;
    private pollingInterval;
    private volumeStep;
    private state;
    constructor(platform: KefPlatform, accessory: PlatformAccessory);
    init(): Promise<void>;
    createTVService(): Promise<void>;
    createTVSpeakerService(): Promise<void>;
    updateSpeakersState(_error: any, status: any): void;
    getPowerState(callback: CharacteristicGetCallback): void;
    setPowerState(state: CharacteristicValue, callback: CharacteristicSetCallback): void;
    selectVolume(direction: CharacteristicValue, callback: CharacteristicSetCallback): void;
    setVolume(volume: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getVolume(callback: CharacteristicSetCallback): void;
    getMute(callback: CharacteristicSetCallback): void;
    setMute(callback: CharacteristicSetCallback): void;
    sendPlayerCommand(command: String, callback: CharacteristicSetCallback): void;
    selectInputSource(direction: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getInputSource(callback: CharacteristicGetCallback): void;
    setInputSource(inputIdentifier: CharacteristicValue, callback: CharacteristicSetCallback): void;
    setInputSources(): void;
    createInputSourceServices(): Promise<null>;
}
//# sourceMappingURL=accessory.d.ts.map