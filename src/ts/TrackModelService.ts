/**
 * Обертка над моделью , содержит алгоритмы и кеши
 */
import {TrackModel} from "./model/TrackModel";
import {Interval} from "./model/Interval";
import {IntervalStatistic} from "./IntervalStatistic";
import {TrackSegment} from "./model/TrackSegment";
import {TrackPoint} from "./model/TrackPoint";
import {Binding} from "./sequence/Binding";
import {LatLng} from "leaflet";
import {Settings} from "./Settings";
import {Mark} from "./model/Mark";
import {Photo} from "./model/Photo";
import {Pause} from "./model/Pause";


export class TrackModelService {
    private readonly _model: TrackModel;
    private intervalsStatistics: Map<Interval, IntervalStatistic> = new Map<Interval, IntervalStatistic>();
    private globalInterval: Interval;

    constructor(model: TrackModel) {
        this._model = model;
        if(Settings.editMode) {
            this.model.checkAndNormalize();
        }
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
        let intervalStatistic = this.intervalsStatistics.get(interval);
        if (!intervalStatistic) {
            intervalStatistic = this.getTrackStatistic(this._model.segments, interval.from, interval.to);
            this.intervalsStatistics.set(interval, intervalStatistic);
        }
        return intervalStatistic;
    }



    static findPauses(segment: TrackSegment) : Array<Pause>{
        const points = segment.points;
        let res : Array<Pause> = [];

        let cur1 = 0;
        let cur2 = 1;

        let pauseBegin:boolean = false;

        while (cur2 < points.length) {
            let p1 = points[cur1];
            if (cur1==cur2 || cur2 < points.length - 1 && p1.distanceTo(points[cur2 + 1]) < 30) {
                cur2++;
            } else {
                let p2 = points[cur2];
                let deltaT = p2.date.getTime() - p1.date.getTime();

                if (deltaT > 180000) {//нашли паузу
                    if (!pauseBegin) {
                        pauseBegin = true;

                        //"поджимаем" нижнюю точку к верхней
                        let deltaLBase = p2.distanceTo(p1);
                        for (let i = cur1 + 1; i < cur2; i++) {
                            let p = points[i];
                            if ((deltaLBase - p2.distanceTo(p))
                                / (p.date.getTime() - p1.date.getTime()) > 10 / 60000) {//скорость приближения к p2 > 10 м/мин)
                                cur1 = i;
                            }
                        }
                        //после чего двигаем верхнюю точку вперед, продолжая основной цикл алгоритма
                    } else {
                        //"поджимаем" верхнюю точку к нижней

                        let deltaLBase = p2.distanceTo(p1);
                        for (let i = cur2 - 1; i > cur1; i--) {
                            let p = points[i];
                            if ((deltaLBase - p1.distanceTo(p))
                                / (p2.date.getTime() - p.date.getTime()) > 10 / 60000) {//скорость приближения к p2 > 10 м/мин)
                                cur2 = i;
                            }
                        }
                        p2 = points[cur2];
                        let deltaT = p2.date.getTime() - p1.date.getTime();
                        if (deltaT > 180000) {//То, что нашили в результате  уточнения действительно оказалась паузой.
                            res.push(new Pause(p1.date, p2.date))
                            cur1 = cur2;
                            cur2++;
                            pauseBegin = false;
                        }else {//не пауза, двигаем дальше
                            pauseBegin = false;
                            cur1 ++;
                        }
                    }
                }
                else {
                    pauseBegin = false;
                    cur1 ++;
                }
            }

        }
        return res;

    }

    public getTrackStatistic(track: TrackSegment[], from: Date, to: Date): IntervalStatistic {
        if(!(from < to)){
            throw new Error(`To date (${to}) must be after from date(${from})`)
        }
        
        var distance: number = 0;
        var altitudeGain: number = 0;
        var altitudeLoss: number = 0;
        var timeInMotion: number = 0;
        var maxLat: number = -1000;
        var maxLng: number = -1000;
        var minLat: number = 1000;
        var minLng: number = 1000;
        var begin: TrackPoint = null;
        var end: TrackPoint = null;
        var pauses: Array<[TrackPoint, TrackPoint]> = [];
        var beginPointer: {segmentIndex:number, pointIndex: number} = null;
        var endPointer: {segmentIndex:number, pointIndex: number} = null;
        
        for (let k = 0; k < track.length; k ++) {
            const points = track[k].points;
            if(points.length == 0){
                continue;
            }
            const toIndex = TrackModelService.binarySearch(points,
                (point: TrackPoint):boolean => {
                    return  point.date > to;
                }
            );
            const fromIndex = TrackModelService.binarySearch(points,
                (point: TrackPoint):boolean => {
                 return  point.date>=from;
                }
            );

            
            if(fromIndex == points.length || toIndex == 0){//Интервал целиком вне сегмента
                continue;
            }
            //крайние точки
            for (let i = fromIndex; i < toIndex; i++) {
                let p = points[i];
                maxLat = Math.max(p.lat, maxLat);
                maxLng = Math.max(p.lng, maxLng);
                minLat = Math.min(p.lat, minLat);
                minLng = Math.min(p.lng, minLng);
            }
            //Начало и конец интервала
            const first = points[fromIndex];
            if (begin == null || begin.date > first.date) {
                begin = first;
                beginPointer = {segmentIndex: k, pointIndex: fromIndex};
            }
            const last = points[toIndex - 1];
            if (end == null || end.date < last.date) {
                end = last;
                endPointer = {segmentIndex: k, pointIndex: toIndex -1};
            }

            let deltaT = last.date.getTime() - first.date.getTime();
            this.model.pauses.forEach((p) => {//todo - можно довести до идеала, делать  binary search.
                const pauseBegin = p.from;
                const pauseEnd = p.to;
                const endInside = pauseEnd >= first.date && pauseEnd <= last.date;
                const beginInside = pauseBegin >= first.date && pauseBegin <= last.date;

                if(beginInside && endInside){
                    deltaT -= pauseEnd.getTime() - pauseBegin.getTime();
                } else if (!beginInside && endInside) {
                    deltaT -= pauseEnd.getTime() - begin.date.getTime();
                } else if (beginInside && !endInside) {
                    deltaT -= last.date.getTime() - pauseBegin.getTime();
                }
            })
            timeInMotion+=deltaT;
            
            let deltaH = 0;
            for (let i = fromIndex; i < toIndex - 1; i++) {
                let p1 = points[i];
                let p2 = points[i + 1];
                deltaH += (p2.alt - p1.alt);
                //перепады меньше 10 м не учитываем.
                if (deltaH > 10) {
                    altitudeGain += deltaH;
                    deltaH = 0;
                } else if ((deltaH < -10)) {
                    altitudeLoss += deltaH;
                    deltaH = 0;
                }
            }
            if(deltaH > 0){//добавляем последний кусок
                altitudeGain += deltaH;
            } else if ((deltaH < 0)){
                altitudeLoss += deltaH;
            }


            let p1 = points[fromIndex];
            for (let i = fromIndex; i < toIndex-1; i++) {
                let p2 = points[i + 1];
                const deltaL = p1.distanceTo(p2);
                if(deltaL > 50 || i == toIndex - 2){
                    distance += deltaL;
                    p1 = p2;
                }
            }
        }
        let readBeginDate = begin.date;
        let realEndDate = end.date;
        //корректировка начала и конца
        if(beginPointer) {
            const k = beginPointer.segmentIndex;
            const i = beginPointer.pointIndex;
            let prevPointDate: Date;
            if(i>0){
                prevPointDate = track[k].points[i-1].date;
            }else if(k>0){
                const segment = track[k-1].points;
                prevPointDate = segment[segment.length -1].date;
            }
            if(!prevPointDate){
                prevPointDate = new Date(0)
            }
             for(const p of this.model.pauses) {
                if(prevPointDate < p.to && begin.date > p.to){
                   readBeginDate = p.to;
                   timeInMotion += (begin.date.getTime() - p.to.getTime());
                   break;
                }
            }
        }

        if(endPointer) {
            const k = endPointer.segmentIndex;
            const i = endPointer.pointIndex;
            let nextPointDate: Date;
            const segmentK = track[k].points;
            if (i < segmentK.length-1) {
                nextPointDate = segmentK[i + 1].date;
            } else if (k < track.length - 1) {
                nextPointDate = track[k + 1].points[0].date;
            }
            if(!nextPointDate){
                nextPointDate = new Date(8640000000000000);//max js date
            }
            for(const p of this.model.pauses) {
                if(end.date < p.from && nextPointDate > p.from){
                    realEndDate = p.from;
                    timeInMotion += (p.from.getTime() - end.date.getTime());
                    break;

                }
            }
        }



        return new IntervalStatistic(
            distance,
            altitudeGain,
            altitudeLoss,
            timeInMotion,
            begin,
            end,
            maxLat,
            maxLng,
            minLat,
            minLng,
            readBeginDate,
            realEndDate
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

    private bindObjects(): Binding [] {
        const res : Binding []= [];

        for (const photo of this.model.photos) {   //todo сложность алгоритма n*m
            const point = TrackModelService.findNearestTrackPoint(new LatLng(photo.lat, photo.lng), this.model) ;
            res.push(new Binding(point, photo));
        }
        // for (const photo of this.model.marks) {  не используем
        //     const point = TrackModelService.findNearestTrackPoint(new LatLng(photo.lat, photo.lng), this.model) ;
        //     res.push(new Binding(point, photo));
        // }

        return res;
    }


//todo есть oчень похожая функция, надо оптимизировать.
    private static findNearestTrackPoint(target: LatLng, model: TrackModel): TrackPoint {
        let res = model.segments[0].points[0];
        for (const segment of model.segments) {
            let dist = TrackModelService.roughDistance(segment.points[0], target);//todo - может, нужна точная функция

            for (const point of segment.points) {
                const dist1 = TrackModelService.roughDistance(point, target);
                if (dist > dist1) {
                    dist = dist1;
                    res = point;
                }
            }
        }
        return res;
    }

    //todo - дубликат
    private static roughDistance(p1: LatLng, p2: LatLng) {
        return Math.abs(p1.lat - p2.lat) + Math.abs(p1.lng - p2.lng)
    }

    private bindIntervals(): Binding [] {
        const res = [];

        for (const interval of this.model.intervals) {
            for (const trackSegment of this.model.segments) {
                if (trackSegment.points.length == 0) {
                    continue;
                }
                const fromIndex = TrackModelService.binarySearch(trackSegment.points,
                    (point: TrackPoint): boolean => {
                        return point.date >= interval.from;
                    }
                );
                if (fromIndex != trackSegment.points.length) {
                    res.push(new Binding(trackSegment.points[fromIndex], interval));
                }

            }
        }
        return res;
    }

    public getSequenceArray() {
        return this.bindIntervals().sort(
            //Порядок сортировки:
            //1. По дате
            //2. Интервал больше объектов;
            //3. Больший интервал - больше
            (a, b) => {
                const dateDiff = a.point.date.getTime() - b.point.date.getTime();
                if(dateDiff != 0 ) {
                    return dateDiff;
                }
                else if (a.object instanceof Interval && ! (b.object instanceof Interval)){
                    return -1;
                }
                else if (!(a.object instanceof Interval) && b.object instanceof Interval){
                    return 1;
                }
                else if (a.object instanceof Interval && b.object instanceof Interval){
                    return b.object.to.getTime() - a.object.to.getTime();
                }

                return dateDiff;
            }

        );
    }

    removeMark(mark: Mark) {
       this.model.marks = this.model.marks.filter(m => m !== mark)

    }

    removePhoto(photo: Photo) {
        this.model.photos = this.model.photos.filter(p => p !== photo)
    }

    removeInterval(interval: Interval) {
        this.model.intervals = this.model.intervals.filter(i => i !== interval);
    }

    clearStatistic() {
        this.intervalsStatistics.clear();
    }

    addMark(mark: Mark) {
        this.model.marks.push(mark);
    }

    addPhoto(photo: Photo) {
        this.model.photos.push(photo)
    }

    addInterval(interval: Interval) {
        this.model.intervals.push(interval);
    }

    removePause(pause: Pause) {
        this.model.pauses = this.model.pauses.filter(p => p !== pause);
        this.clearStatistic();
    }
}