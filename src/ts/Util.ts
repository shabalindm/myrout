import {Track} from "./model/Track";
import {SequenceIF} from "./sequence/SequenceIF";
import {Interval} from "./model/Interval";
import {ArraySequence} from "./sequence/ArraySequence";

export class Util {
    /**
     * Берем точку на треку, и выстраиваем от нее последовательность интервалов, которые ее покрывают.
     * Последовательность такая: сначала все интервалы, покрывающие точку, начиная с самого малого,
     * затем - все остальныe в естественной последовательности.
     * @param selectedPointIndex
     * @param track
     */
    static createIntervalSequence(track:Track, selectedPointIndex: number): SequenceIF<Interval>{
        var before: Array<Interval> = [];
        var after: Array<Interval> = [];
        var covering: Array<Interval> = [];

        track.intervals.forEach((interval)=> {
            if(interval.to  <= selectedPointIndex){//заканчиваются до выбаранной точки
                before.push(interval)
            } else if(interval.from > selectedPointIndex){//начинаются после выбранной точки
                after.push(interval)
            } else {
                covering.push(interval);
            }
        });

        if(covering.length == 0){
            return null;
        }
        covering.sort((a, b) =>  (a.to - a.from) - (b.to - b.from));//Начиная с самых коротких

        var cur = before.length;
        return new ArraySequence(before.concat(covering).concat(after), cur);
    }

}