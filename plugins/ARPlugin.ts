import { registerPlugin } from '@capacitor/core';

export interface ARPluginInterface {
  openSceneViewer(options: { intentUri: string }): Promise<void>;
}

const ARPlugin = registerPlugin<ARPluginInterface>('ARPlugin');

export { ARPlugin };
