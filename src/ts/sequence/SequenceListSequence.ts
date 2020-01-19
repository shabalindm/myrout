import {SequenceIF} from "./SequenceIF";
import {ArraySequence} from "./ArraySequence";

export class SequenceListSequence<T> implements SequenceIF<T> {

    private sequences:Array<SequenceIF<T>>;
    private cur : number;


    private constructor(sequences: Array<SequenceIF<T>>, cur: number) {
        this.sequences = sequences;
        this.cur = cur;
    }

    public static create <T1>(sequenses: Array<SequenceIF<T1>>, cur: number): SequenceIF<T1>{
        //отфильтруем пустые, без них проще
        let sequences = sequenses.filter((i) => i.current());
        if(sequences.length == 0){//вернем пустую последовательность
            return new ArraySequence([], 0);
        }
        return new SequenceListSequence(sequenses, cur);
    }

    hasNext(): boolean {
       return  this.sequences[this.cur].hasNext() || this.cur < this.sequences.length -1;
    }

    hasPrev(): boolean {
        return  this.sequences[this.cur].hasPrev() || this.cur > 0;
    }

    next(): T {
        if(this.sequences[this.cur].hasNext()){
            return this.sequences[this.cur].next();
        } else {
            this.cur++;
            return this.sequences[this.cur].begin();
        }
    }

    prev(): T {
        if(this.sequences[this.cur].hasPrev()){
            return this.sequences[this.cur].prev();
        } else {
            this.cur--;
            return this.sequences[this.cur].end();
        }
    }

    begin(): T {
        this.cur = 0;
        return this.sequences[this.cur].begin();
    }

    end(): T {
        this.cur = this.sequences.length -1;
        return this.sequences[this.cur].end();
    }

    current(): T {
         return this.sequences[this.cur].current();
    }



}
