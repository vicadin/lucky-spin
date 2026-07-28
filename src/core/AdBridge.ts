export interface AdBridgeInterface {
  init(): Promise<void>;
  openStore(): void;
  isReady(): boolean;
  getNetworkName(): string;
}

class DefaultAdBridge implements AdBridgeInterface {
  private ready = false;

  async init(): Promise<void> {
    this.ready = true;
  }

  openStore(): void {
    window.open('https://example.com', '_blank');
  }

  isReady(): boolean {
    return this.ready;
  }

  getNetworkName(): string {
    return 'default';
  }
}

let instance: AdBridgeInterface = new DefaultAdBridge();

export function setAdBridge(bridge: AdBridgeInterface): void {
  instance = bridge;
}

export function getAdBridge(): AdBridgeInterface {
  return instance;
}

/* TODO: network bridge */
export function openStore(): void {
  instance.openStore();
}

export async function initAdBridge(): Promise<void> {
  await instance.init();
}
