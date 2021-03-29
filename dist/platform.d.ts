import { API, IndependentPlatformPlugin, Logger, PlatformConfig, Service, Characteristic } from 'homebridge';
import KefAPI from './kef';
export declare class KefPlatform implements IndependentPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly KefAPI: KefAPI;
    constructor(log: Logger, config: PlatformConfig, api: API);
    discoverSpeakers(): void;
}
//# sourceMappingURL=platform.d.ts.map