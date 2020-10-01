/**
 * Обертка над моделью , содержит алгоритмы и кеши
 */
import {TrackModel} from "./model/TrackModel";
import {Interval} from "./model/Interval";
import {IntervalStatistic} from "./IntervalStatistic";
import {TrackSegment} from "./model/TrackSegment";
import {TrackPoint} from "./model/TrackPoint";


export class TrackModelService {
    private readonly _model: TrackModel;
    private intervalsStatistics: Map<Interval, IntervalStatistic> = new Map<Interval, IntervalStatistic>();
    private globalInterval: Interval;

    constructor(model: TrackModel) {
        this._model = model;
    }

    get model(): TrackModel {
        return this._model;
    }

    public getGlobalInterval(){
        if(this.globalInterval == null){
            let begin: Date = null;
            let end: Date = null;
            for (const trackSegment of this._model.segments) {
                const segmentBegin = trackSegment.points[0].date;
                if (begin == null || begin > segmentBegin) {
                    begin = segmentBegin;
                }
                const segmentEnd = trackSegment.points[trackSegment.points.length - 1].date;
                if (end == null || end < segmentEnd) {
                    end = segmentEnd;
                }
            }
            this.globalInterval = new Interval(begin,end, this.model.name, this.model.description)
        }

        return this.globalInterval;
    }

    public getIntervalStatistic(interval:Interval): IntervalStatistic {
        if(!this.intervalsStatistics.get(interval)){
            this.intervalsStatistics.set(interval,
                TrackModelService.getTrackStatistic(this._model.segments, interval.from, interval.to)
            );
        }
        return this.intervalsStatistics.get(interval);
    }

    public static getTrackStatistic(track: TrackSegment[], from: Date, to: Date): IntervalStatistic {
        if(!(from < to)){
            throw new Error(`To date (${to}) must be after from date(${from})`)
        }
        
        var distance: number = 0;
        var altitudeGain: number = 0;
        var altitudeLoss: number = 0;
        var timeInMotion: number = 0;
        var maxLat: number = - 90;
        var maxLng: number = - 180;
        var minLat: number = 90;
        var minLng: number = 180;
        var realBegin: Date = null;
        var realEnd: Date = null;
        
        for (const trackSegment of track) {
            if(trackSegment.points.length == 0){
                continue;
            }
            const toIndex = this.binarySearch(trackSegment.points,
                (point: TrackPoint):boolean => {
                    return  point.date > to;
                }
            );
            const fromIndex = this.binarySearch(trackSegment.points,
                (point: TrackPoint):boolean => {
                 return  point.date>=from;
                }
            );

            
            if(fromIndex == trackSegment.points.length || toIndex == 0){//Интервал целиком вне сегмента
                continue;
            }
            //крайние точки
            for (let i = fromIndex; i < toIndex; i++) {
                let p = trackSegment.points[i];
                maxLat = Math.max(p.lat, maxLat);
                maxLng = Math.max(p.lat, maxLng);
                minLat = Math.max(p.lat, minLat);
                minLng = Math.max(p.lat, minLng);
            }
            //Начало и конец интервала
            const begin = trackSegment.points[fromIndex].date;
            if (realBegin == null || realBegin > begin) {
                realBegin = begin;
            }
            const end = trackSegment.points[toIndex - 1].date;
            if (realEnd == null || realEnd < end) {
                realEnd = end;
            }
            
            let deltaH = 0;
            for (let i = fromIndex; i < toIndex-1; i++) {
                let p1 = trackSegment.points[i];
                let p2 = trackSegment.points[i+1];
                if( p1.date >= from &&  p2.date <= to){
                    //Считаем перепады высот, игнорируя все, что меньше
                    deltaH += (p2.alt - p1.alt);
                    //перепады меньше 10 м не учитываем.
                    if(deltaH > 10){
                        altitudeGain += deltaH;
                        deltaH = 0;
                    } else if ((deltaH < -10)){
                        altitudeLoss += deltaH;
                        deltaH = 0;
                    }
                }
            }
            if(deltaH > 0){
                altitudeGain += deltaH;
            } else if ((deltaH < 0)){
                altitudeLoss += deltaH;
            }

            for (let i = fromIndex; i < toIndex-1; i++) {
                let p1 = trackSegment.points[i];
                let p2 = trackSegment.points[i+1];
                if(p1.date >= from && p2.date <= to){
                    const deltaL = p1.distanceTo(p2);
                    distance += deltaL;
                    const deltaT = p2.date.getTime() - p1.date.getTime();
                    if(deltaL > 50 || deltaT < 180000){//все, что меньше 3 мин - не считаем за остановку движения
                        timeInMotion += deltaT;
                    }
                }
            }

        }
        return new IntervalStatistic(
            distance,
            altitudeGain,
            altitudeLoss,
            timeInMotion,
            realBegin,
            realEnd,
            maxLat,
            maxLng,
            minLat,
            minLng,
        );
    }

    /**
     * Ищем индекс первого элемента, который удовлетворяет условию.
     * @param ar
     * @param checkFunction
     * @private
     *
     */
    static binarySearch<T>(ar: Array<T>, checkFunction: (_: T) => boolean) {
        if (checkFunction(ar[0])) {
            return 0;
        }
        if (!(checkFunction(ar[ar.length - 1]))){
            return ar.length;
        }

        let search = function (ar: Array<T>, from: number, to: number): number {
            if (to - from == 1) {
                if (!(checkFunction(ar[from])) && checkFunction(ar[to])) {
                    return to;
                }
                throw new Error("Algorithm error");
            }
            const m = (to + from)>>1;
            if (checkFunction(ar[m])) {
                return search(ar, from, m);
            } else {
                return search(ar, m, to);
            }
        }
        return search(ar, 0, ar.length - 1);
    }
    
}