export type CloudKvModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

/**
 * reason: 0 = changed on another device, 1 = first values from iCloud, 2 = quota exceeded,
 * 3 = the iCloud account changed (see NSUbiquitousKeyValueStore change reasons).
 */
export type ChangeEventPayload = {
  reason: number;
  keys: string[];
};
