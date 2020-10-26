/**
 * Модель данных для трека
 */

import {Mark} from "./Mark";
import {Photo} from "./Photo";
import {Interval} from "./Interval";
import {TrackSegment} from "./TrackSegment";
import {Pause} from "./Pause";


export class TrackModel{
    private _name: string;
    private _description: string;

    /**
     * Сегметны трека.
     */
    private _segments: Array<TrackSegment> = [];

    /**
     * Метки на треке. Каждая метка обязана быть привязана к точке трека, но может быть смещена относительно нее.
     */
    private _marks: Array<Mark> = [];

    /**
     * Фотографии. Каждая фотография обязана быть привязана к точке трека, но может быть смещена относительно нее.
     * Дата и время точки трека, к которой привязана фотография, может не совпадать с датой и временем фотографии.
     */
    private _photos: Array<Photo> = [];

    /**
     * Участки пути на треке. Участки могут накладываться друг на друга, пресекаться и т.д.
     */
    private _intervals: Array<Interval> = [];

    /**
     * Остановки в пути
     * @private
     */
    private _pauses: Array<Pause> = [];


    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get segments(): Array<TrackSegment> {
        return this._segments;
    }

    set segments(value: Array<TrackSegment>) {
        this._segments = value;
    }

    get marks(): Array<Mark> {
        return this._marks;
    }

    set marks(value: Array<Mark>) {
        this._marks = value;
    }


    get photos(): Array<Photo> {
        return this._photos;
    }

    set photos(value: Array<Photo>) {
        this._photos = value;
    }

    get intervals(): Array<Interval> {
        return this._intervals;
    }

    set intervals(value: Array<Interval>) {
        this._intervals = value;
    }

    get pauses(): Array<Pause> {
        return this._pauses;
    }

    set pauses(value: Array<Pause>) {
        this._pauses = value;
    }

    public checkAndNormalize(){
        let set:any = [];
        this.intervals.forEach(i =>{
           if(!i.name || !i.from || !i.to) {
               throw new Error("Invalid interval: " + JSON.stringify(i))
           }
           if(i.id){
               if(set[i.id]){
                   throw new Error("Duplicate interval id: " + i.id)
               }
               set[i.id] = i.id;
           }
        })
        set = [];
        this.photos.forEach(p => {
            if (!p.url || !p.lat || !p.lng) {
                throw new Error("Invalid photo: " + JSON.stringify(p))
            }

            if (set[p.url]) {
                throw new Error("Duplicate photo: " + p.url)
            }
            set[p.url] = p.url;
        })
        this.marks.forEach(m =>{
            if (!m.name || !m.lat || !m.lng) {
                throw new Error("Invalid mark: " + JSON.stringify(m))
            }
        })

        this.segments = this.segments.filter(s => s.points.length > 1).sort(((a, b) => a.points[0].date.getTime() - b.points[0].date.getTime()));
        this.pauses = this.pauses.sort(((a, b) => a.from.getTime() - b.from.getTime()));
        this.pauses.forEach(p => {
            if(p.to <= p.from){
                throw Error("Invalid pause: " + JSON.stringify(p))
            }
        })
        if(this.pauses.length > 0) {
            let pauses = [];
            let prevPause = this.pauses[0];
            for (let i = 0; i < pauses.length; i++) {
                const p = this.pauses[i];
                if(p.from > prevPause.to){
                    prevPause = p;
                    pauses.push(p);
                } else {
                    prevPause.to = p.to;
                }
            }
            this.pauses = pauses;
        }




    }
}