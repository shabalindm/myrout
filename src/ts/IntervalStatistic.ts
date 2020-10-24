import {TrackPoint} from "./model/TrackPoint";


export class IntervalStatistic{
   readonly distance: number;
   readonly altitudeGain: number;
   readonly altitudeLoss: number;
   readonly timeInMotion: number;
   readonly begin: TrackPoint;
   readonly end: TrackPoint;
   readonly maxLat: number;
   readonly maxLng: number;
   readonly minLat: number;
   readonly minLng: number;
   readonly realBegin: Date;
   readonly realEnd: Date;


   constructor(distance: number, altitudeGain: number, altitudeLoss: number, timeInMotion: number,
               begin: TrackPoint, end: TrackPoint, maxLat: number,
               maxLng: number, minLat: number, minLng: number, realBegin: Date, realEnd: Date) {
      this.distance = distance;
      this.altitudeGain = altitudeGain;
      this.altitudeLoss = altitudeLoss;
      this.timeInMotion = timeInMotion;
      this.begin = begin;
      this.end = end;
      this.maxLat = maxLat;
      this.maxLng = maxLng;
      this.minLat = minLat;
      this.minLng = minLng;
      this.realBegin = realBegin;
      this.realEnd = realEnd;
   }
}