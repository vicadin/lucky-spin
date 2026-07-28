import { setAdBridge, type AdBridgeInterface } from './AdBridge';

declare global {
  interface Window {
    mraid?: MraidLike;
  }
}

interface MraidLike {
  getState(): string;
  addEventListener(event: string, listener: () => void): void;
  removeEventListener(event: string, listener: () => void): void;
  open(url: string): void;
  isViewable(): boolean;
}

class MraidBridgeImpl implements AdBridgeInterface {
  private ready = false;
  private readonly storeUrl = 'https://play.google.com/store';

  async init(): Promise<void> {
    const mraid = window.mraid;
    if (!mraid) {
      this.ready = true;
      return;
    }

    return new Promise((resolve) => {
      const onReady = (): void => {
        this.ready = true;
        mraid.removeEventListener('ready', onReady);
        resolve();
      };

      if (mraid.getState() === 'loading') {
        mraid.addEventListener('ready', onReady);
      } else {
        this.ready = true;
        resolve();
      }
    });
  }

  openStore(): void {
    const mraid = window.mraid;
    if (mraid) {
      mraid.open(this.storeUrl);
    } else {
      window.open(this.storeUrl, '_blank');
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  getNetworkName(): string {
    return 'mraid';
  }
}

export async function initMraidBridge(): Promise<void> {
  if (typeof window !== 'undefined' && window.mraid) {
    const bridge = new MraidBridgeImpl();
    setAdBridge(bridge);
    await bridge.init();
  }
}

export { MraidBridgeImpl };
