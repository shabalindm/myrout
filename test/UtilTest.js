import {TrackModel} from "../src/ts/model/TrackModel";
import {TrackPoint} from "../src/ts/model/TrackPoint";
import {Interval} from "../src/ts/model/Interval";

if (typeof window === 'undefined') { 
    var assert = require('chai').assert; // для запуска в консоле NODE
} else {
    var assert = chai.assert; // для запуска в браузере
}
describe('createIntervalSequence',()=>{

    it('createIntervalSequence',()=>{
        let track = new TrackModel();
        track.points = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => new TrackPoint(i, i, 0, new Date(i) ));
        let interval = (from, to) => {
            let interval = new Interval();
            interval.from = new Date(from);
            interval.to = to;
            return interval};
        track.intervals = [interval(0, 5), interval(1,4), interval(2,4)]
    });
});