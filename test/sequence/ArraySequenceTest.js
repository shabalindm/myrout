import {ArraySequence} from "../../src/ts/sequence/ArraySequence.ts";

const assert = require('chai').assert;

describe('ArraySequence',()=>{

    it('Методы пустой последовательности',()=>{
        let s = new ArraySequence([], 0);
        assert.isNotOk(s.hasNext());
        assert.isNotOk(s.hasPrev());
        assert.equal(undefined, s.current());
        s.begin();
        s.end();
    });
    it('Прогон последовательности',()=>{
        let s = new ArraySequence([1,2], 0);
        assert.isOk(s.hasNext());
        assert.isNotOk(s.hasPrev());
        assert.equal(1, s.current());
        s.next();
        assert.isNotOk(s.hasNext());
        assert.isOk(s.hasPrev());
        assert.equal(2, s.current());
    });

    it('begin-end',()=>{
        let s = new ArraySequence([1,2,3], 1);
        assert.equal(2, s.current());
        s.begin();
        assert.equal(1, s.current());
        s.end();
        assert.equal(3, s.current());
    });
});