export interface ActivityPrediction {
  shopId: string;
  oldestActivity: number;
  hours: Array<PredictionHour>;
}

export interface PredictionHour {
  time: number;
  prediction: number;
}

export type ActivityMode = 'today' | 'tomorrow' | 'week';
