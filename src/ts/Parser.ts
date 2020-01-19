import {TripModel} from "./model/TripModel";
import {TrackPoint} from "./model/TrackPoint";
import {Interval} from "./model/Interval";
import {MarkedTrackPoint} from "./model/MarkedTrackPoint";
import {CrucialTrackPoint} from "./model/CrucialTrackPoint";
import {Track} from "./model/Track";


export class Parser {

    static parseResponse(response: any): TripModel {
        // if(response.type){
        //     if(response.type === 'schema'){

        let tracks: Array<Track> = response.tracks.map(
            (track: any) => {
                let pointIdsReverseMap = new Map<string, number>();
                for (var i = 0; i < track.points.length; i++) {
                    let id :string = track.points[i].id;
                    if(id) {
                        pointIdsReverseMap.set(id, i);
                    }
                }
                let points = track.points.map((p: any) => this.parseTrackPoint(p));
                let intervals: Array<Interval> =  track.intervals.map((x:any) => this.parseInterval(x, pointIdsReverseMap));

                let track1 = new Track();
                track1.points = points;
                track1.intervals = intervals;
                return track1;
            });


        return new TripModel(tracks, null);
    }

    //хардкорный парсер
    static parseTrackPoint(o: any): TrackPoint {
        let res;
        let lat = o.lat;
        let lng = o.lng;
        let alt = o.alt;
        if (o.name || o.description){
            if (!o.type) {
                res = new MarkedTrackPoint(lat, lng, alt);
            } else {
                if (o.type == 'critPoint') {
                    res = new CrucialTrackPoint(lat, lng, alt);

                } else {
                    throw new Error("Unknown TrackPointType: " + o.type)
                }
            }
            res.description = o.description;
            res.name = o.name;
        } else {
            res = new TrackPoint(lat, lng, alt)
        }

        res.date = o.date;
        res.id = o.id;
        return res;
    }

    static parseInterval(i: any, pointIdsReverseMap: Map<string, number>): Interval {
        let res = new Interval();
        res.name = i.name;
        res.description = i.description;
        res.from = pointIdsReverseMap.get(i.id1);
        res.to = pointIdsReverseMap.get(i.id2)+1;
        if(res.from == undefined || res.to == undefined){
            throw new Error("Invalid Interval" + JSON.stringify(res))
        }
        return res;
    }
}