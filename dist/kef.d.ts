interface SystemConfig {
    serialNumber: string | null;
    modelName: string | null;
    firmwareVersion: string | null;
    inputs: Array<string>;
}
export default class KefAPI {
    private ip;
    catchRequestErrors: Boolean;
    constructor(ip: string);
    getSystemConfig(): Promise<SystemConfig>;
    isOn(): Promise<string>;
    powerOn(): Promise<null>;
    powerOff(): Promise<null>;
    getVolume(): Promise<string>;
    setVolume(volume: any): Promise<null>;
    getInputSource(): Promise<string>;
    setInputSource(source: String): Promise<null>;
    sendPlayerCommand(command: String): Promise<null>;
    getPlayerState(): Promise<string>;
    _getModelName(): Promise<string | null>;
    _getSerialNumber(): Promise<string>;
    _getData(queryString: String): Promise<Object>;
    _setData(data: Object): Promise<Object>;
}
export {};
//# sourceMappingURL=kef.d.ts.map