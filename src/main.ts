import '@/styles/reset.css';
import '@/styles/variables.css';
import '@/styles/main.css';

import { Game } from '@/core/Game';

async function bootstrap(): Promise<void> {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('#app container not found');
  }

  const game = new Game(container);

  window.addEventListener('beforeunload', () => game.destroy(), { once: true });

  try {
    await game.start();
  } catch (err) {
    console.error('[Lucky Spin] Boot failed:', err);
  }
}

bootstrap();
