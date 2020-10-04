
import {TrackModelService} from 'Source/ts/TrackModelService';

if (typeof window === 'undefined') { 
    var assert = require('chai').assert; // для запуска в консоле NODE
} else {
    var assert = chai.assert; // для запуска в браузере
}
describe('TrackModelService',()=>{

    it('',()=>{
        assert.equal(TrackModelService.binarySearchInclusive([0,1,2], 0), 0);
    });

});