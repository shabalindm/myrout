
import {SequenceListSequence} from "../../src/ts/sequence/SequenceListSequence.ts";
import {ArraySequence} from "../../src/ts/sequence/ArraySequence.ts";

const assert = require('chai').assert;

describe('SequenceListSequence',()=>{

       it('Прогон последовательности',()=>{
        let sequences = [
            new ArraySequence([1], 0),
            new ArraySequence([2,3,4], 1),
            new ArraySequence([5,6,7], 1),
            new ArraySequence([], 0)
        ];
        let s = SequenceListSequence.create(sequences, 1);
        assert.equal(3, s.current());
        s.prev();
        assert.equal(2, s.current());
        assert.isOk(s.hasPrev());
        s.prev();
        assert.isNotOk(s.hasPrev());
        assert.isOk(s.hasNext());
        assert.equal(1, s.current());

        for(var i = 2; i<=7; i ++){
          assert.equal(i, s.next(), 'next is not working correctly');
           assert.equal(i, s.current());
           assert.equal(i != 7, s.hasNext());
           assert.isOk(s.hasPrev());
        }
    });

    it('begin-end',()=>{
        let sequences = [
            new ArraySequence([1], 0),
            new ArraySequence([2,3,4], 1),
            new ArraySequence([5,6,7], 1),
            new ArraySequence([], 0)
        ];
        let s = SequenceListSequence.create(sequences, 1);
        assert.equal(3, s.current());
        s.begin();
        assert.equal(1, s.current());
        s.end();
        assert.equal(7, s.current());
    });
});