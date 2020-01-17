import {TrackPoint} from "./TrackPoint";
import {TripData} from "./TripData";
import {CrucialTrackPoint} from "./CrucialTrackPoint";
import {NamedTrackPoint} from "./NamedTrackPoint";
import {RoutInterval} from "./RoutInterval";


export class Parser {

    static parseResponse(response: any): TripData {
        // if(response.type){
        //     if(response.type === 'schema'){

        let track: Array<Array<TrackPoint>> = response.track.map(
            (chunk: any) => {
                chunk.map((p: any) => this.parseTrackPoint(p))
            });

        let intervals: Array<RoutInterval> =  response.intervals.map((x:any) => this.parseInterval(x));

        return new TripData(track, null, intervals);
    }

    //хардкорный парсер
    static parseTrackPoint(o: any): TrackPoint {
        let res;
        if (o.name || o.description){
            if (!o.type) {
                res = new NamedTrackPoint();
            } else {
                if (o.type == 'critPoint') {
                    res = new CrucialTrackPoint();
                    res.arrivalTime = o.arrivalTime;
                    res.leavingTime = o.leavingTime;
                } else {
                    throw new Error("Unknown TrackPointType: " + o.type)
                }
            }
            res.description = o.description;
            res.name = o.name;
        } else {
            res = new TrackPoint()
        }
        res.lat = o.lat;
        res.lng = o.lng;
        res.alt = o.alt;
        res.date = o.date;
        res.id = o.id;
        return res;
    }

    static parseInterval(i: any): RoutInterval {
        let res = new RoutInterval();
        res.name = i.name;
        res.description = i.description;
        res.fromPointId = i.id1;
        res.toPointId = i.id2;
        return res;
    }
}