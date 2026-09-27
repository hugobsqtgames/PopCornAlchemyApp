import { NativeModule, requireOptionalNativeModule } from 'expo';

import { CloudKvModuleEvents } from './CloudKv.types';

declare class CloudKvModule extends NativeModule<CloudKvModuleEvents> {
  getAsync(key: string): Promise<string | null>;
  setAsync(key: string, value: string): Promise<void>;
}

/** Null where the native code is not inside the app (Expo Go, Android, the web). */
export default requireOptionalNativeModule<CloudKvModule>('CloudKv');
