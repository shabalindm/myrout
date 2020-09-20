

export class IntervalStatistic{
   readonly distance: number;
   readonly altitudeGain: number;
   readonly altitudeLoss: number;
   readonly timeInMotion: number;
   readonly realBegin: Date;
   readonly realEnd: Date;
   readonly maxLat: number;
   readonly maxLng: number;
   readonly minLat: number;
   readonly minLng: number;


   constructor(distance: number, altitudeGain: number, altitudeLoss: number, timeInMotion: number, realBegin: Date, realEnd: Date, maxLat: number, maxLng: number, minLat: number, minLng: number) {
      this.distance = distance;
      this.altitudeGain = altitudeGain;
      this.altitudeLoss = altitudeLoss;
      this.timeInMotion = timeInMotion;
      this.realBegin = realBegin;
      this.realEnd = realEnd;
      this.maxLat = maxLat;
      this.maxLng = maxLng;
      this.minLat = minLat;
      this.minLng = minLng;
   }
}