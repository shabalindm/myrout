export class RouteInfo {
    private _distance: number;
    private _distanceTotal: number;
    private _length: number;
    private _time: number;
    private _timeInMotion:number;
    private _atitudeGain:number;
    private _altitudeLoss:number;
    private _name:string;
    private _description:string;


    constructor(distance: number, distanceTotal1: number, length: number, time: number, timeInMotion: number, atitudeGain: number, altitudeLoss: number, name: string, description: string) {
        this._distance = distance;
        this._distanceTotal = distanceTotal1;
        this._length = length;
        this._time = time;
        this._timeInMotion = timeInMotion;
        this._atitudeGain = atitudeGain;
        this._altitudeLoss = altitudeLoss;
        this._name = name;
        this._description = description;
    }


    set distance(value: number) {
        this._distance = value;
    }

    set distanceTotal(value: number) {
        this._distanceTotal = value;
    }

    set length(value: number) {
        this._length = value;
    }

    set time(value: number) {
        this._time = value;
    }

    set timeInMotion(value: number) {
        this._timeInMotion = value;
    }

    set atitudeGain(value: number) {
        this._atitudeGain = value;
    }

    set altitudeLoss(value: number) {
        this._altitudeLoss = value;
    }

    set name(value: string) {
        this._name = value;
    }

    set description(value: string) {
        this._description = value;
    }
}