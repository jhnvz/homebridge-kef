import fetch from 'node-fetch'

interface SystemConfig {
  serialNumber: string|null;
  modelName: string|null;
  firmwareVersion: string|null;
  inputs: Array<string>;
}

export default class KefAPI {

  private ip: String;

  public catchRequestErrors: Boolean = true;

  constructor(ip: string) {
    this.ip = ip;
  }

  getSystemConfig() {
    return new Promise<SystemConfig>((resolve, reject) => {
      // Features are hardcoded for now
      const inputs = [
        "wifi",
        "bluetooth",
        "tv",
        "optical",
        "coaxial",
        "analog"
      ]

      const systemConfig: SystemConfig = {
        serialNumber: null,
        modelName: null,
        firmwareVersion: null, // Unimplemented
        inputs
      }

      const modelNamePromise = this._getModelName().then((modelName) => {
        systemConfig.modelName = modelName
      });

      const serialNumberPromise = this._getSerialNumber().then((serialNumber) => {
        systemConfig.serialNumber = serialNumber
      });

      return Promise.all([modelNamePromise, serialNumberPromise]).then(() => {
        resolve(systemConfig)
      })
    });
  }

  isOn() {
    return new Promise<string>((resolve, _reject) => {
      this.getInputSource().then((inputSource) => {
        resolve(inputSource === 'standby' ? '0' : '1')
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
    return new Promise<string>((resolve, _reject) => {
      this._getData("roles=value&path=player%3Avolume").then((response) => {
        resolve(response[0].i32_.toString())
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
    }

    return new Promise<null>((resolve, _reject) => {
      this._setData(data).then((response) => {
        resolve(null);
      });
    });
  }

  getInputSource() {
    return new Promise<string>((resolve, _reject) => {
      this._getData("path=settings%3A%2Fkef%2Fplay%2FphysicalSource&roles=value").then((response) => {
        resolve(response[0].kefPhysicalSource);
      });
    });
  }

  setInputSource(source: String) {
    const data = {
      "path": "settings:/kef/play/physicalSource",
      "role": "value",
      "value": {
        "type": "kefPhysicalSource",
        "kefPhysicalSource": source
      }
    }

    return new Promise<null>((resolve, _reject) => {
      this._setData(data).then((response) => {
        resolve(null);
      });
    });
  }

  _getModelName() {
    return new Promise<string|null>((resolve, _reject) => {
      this._getData("path=settings%3A%2Fkef%2Fhost%2FmodelName&roles=value").then((response) => {
        switch(response[0].string_) {
          case 'SP4025':
            resolve("LS50 Wireless II")
            break;
          default:
            resolve(null)
        }
      });
    });
  }

  _getSerialNumber() {
    return new Promise<string>((resolve, _reject) => {
      this._getData("roles=value&path=settings%3A%2Fkef%2Fhost%2FserialNumber").then((response) => {
        resolve(response[0].string_)
      });
    });
  }

  _getData(queryString: String) {
    return new Promise<Object>((resolve, _reject) => {
      return fetch(`http://${this.ip}/api/getData?${queryString}`).then(async (response) => {
        const text = await response.text()
        const json = JSON.parse(text);

        // console.log(text, json);

        resolve(json);
      });
    });
  }

  _setData(data: Object) {
    const params = {
      method: 'post',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }

    return new Promise<Object>((resolve, _reject) => {
      return fetch(`http://${this.ip}/api/setData`, params).then(async (response) => {
        const text = await response.text()
        const json = JSON.parse(text);

        // console.log(text, json);

        resolve(json);
      });
    });
  }

}
