import {TrackModel} from "../src/ts/model/TrackModel";
import {TrackPoint} from "../src/ts/model/TrackPoint";
import {Interval} from "../src/ts/model/Interval";


const assert = require('chai').assert;

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