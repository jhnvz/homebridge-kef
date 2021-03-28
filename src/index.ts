import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { KefPlatform } from './platform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, KefPlatform);
};
