import { WHEEL_SEGMENTS, type WheelSegment } from '@/config/wheelConfig';
import { weightedPick } from '@/utils/random';

export interface RewardResult {
  segment: WheelSegment;
  segmentIndex: number;
}

export class RewardSystem {
  pickReward(): RewardResult {
    const segment = weightedPick(WHEEL_SEGMENTS);
    const segmentIndex = WHEEL_SEGMENTS.indexOf(segment);
    return { segment, segmentIndex };
  }

  formatMultiplier(multiplier: number): string {
    return `x${multiplier}`;
  }

  formatWinMessage(multiplier: number): string {
    return `x${multiplier}!`;
  }
}
