import {TrackPoint} from "./TrackPoint";
import {TripData} from "./TripData";

export class Parser {

    static parseResponse(response: any): TripData {
        // if(response.type){
        //     if(response.type === 'schema'){
        let track: Array<TrackPoint> = [];
        response.track.forEach((x: any) => {
            track.push(this.parseTrackPoint(x));
        });

        return new TripData(track, null, null);
        // }
        // }
    }

    static parseTrackPoint(o: any): TrackPoint {
        if (o.type) {
            // todo
        }
        return new TrackPoint(o.lat, o.lng, o.alt, o.date)

    }
}