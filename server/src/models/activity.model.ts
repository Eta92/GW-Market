export interface Activity {
  shopId: string;
  startTime: number;
  endTime: number;
}

export interface ActivityPrediction {
  shopId: string;
  hours: Array<PredictionHour>;
  oldestActivity: number;
}

export interface PredictionHour {
  time: number;
  prediction: number;
}
