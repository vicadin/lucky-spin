export interface AssetManifest {
  images: Record<string, string>;
  sounds: Record<string, string>;
}

const imageModules = import.meta.glob<string>(
  '../assets/images/*.{png,jpg,jpeg,svg,webp}',
  { eager: true, query: '?url', import: 'default' }
);

const soundModules = import.meta.glob<string>(
  '../assets/sounds/*.{mp3,ogg,wav}',
  { eager: true, query: '?url', import: 'default' }
);

function buildImageMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [path, url] of Object.entries(imageModules)) {
    const name = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? path;
    map[name] = url;
  }
  return map;
}

function buildSoundMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [path, url] of Object.entries(soundModules)) {
    const name = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? path;
    map[name] = url;
  }
  return map;
}

export type LoadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export class AssetLoader {
  private readonly images = new Map<string, HTMLImageElement>();
  private readonly sounds = new Map<string, HTMLAudioElement>();
  readonly manifest: AssetManifest;

  constructor() {
    this.manifest = {
      images: buildImageMap(),
      sounds: buildSoundMap(),
    };
  }

  async load(onProgress?: (p: LoadProgress) => void): Promise<void> {
    const imageUrls = Object.entries(this.manifest.images);
    const total = imageUrls.length || 1;
    let loaded = 0;

    const report = (): void => {
      loaded++;
      onProgress?.({ loaded, total, percent: Math.round((loaded / total) * 100) });
    };

    await Promise.all(
      imageUrls.map(([key, url]) =>
        this.loadImage(key, url).then(report).catch(() => {
          report();
        })
      )
    );
  }

  getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  getImageUrl(key: string): string | undefined {
    return this.manifest.images[key];
  }

  getSoundUrl(key: string): string | undefined {
    return this.manifest.sounds[key];
  }

  getSound(key: string): HTMLAudioElement | undefined {
    if (!this.sounds.has(key)) {
      const url = this.getSoundUrl(key);
      if (!url) return undefined;
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.sounds.set(key, audio);
    }
    return this.sounds.get(key);
  }

  destroy(): void {
    this.images.clear();
    for (const audio of this.sounds.values()) {
      audio.pause();
      audio.src = '';
    }
    this.sounds.clear();
  }

  private loadImage(key: string, url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${key}`));
      img.src = url;
    });
  }
}
