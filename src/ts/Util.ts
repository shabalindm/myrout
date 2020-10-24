import {SequenceIF} from "./sequence/SequenceIF";
import {Interval} from "./model/Interval";
import {ArraySequence} from "./sequence/ArraySequence";
import {TrackModel} from "./model/TrackModel";
import {Binding} from "./sequence/Binding";
import {Settings} from "./Settings";
import moment = require("moment");

export class Util {

    /**
     * Берем точку на треку, и выстраиваем от нее последовательность интервалов, которые ее покрывают.
     * Последовательность такая: сначала все интервалы, покрывающие точку, начиная с самого малого,
     * затем - все остальные в естественной последовательности.
     * @param selectedPointIndex
     * @param intervals
     */
    static createIntervalSequence(intervals: Interval[], selectedPointIndex: Date): SequenceIF<Interval>{
        const before: Array<Interval> = [];
        const after: Array<Interval> = [];
        const covering: Array<Interval> = [];

        intervals.forEach((interval)=> {
            if(interval.to  < selectedPointIndex){//заканчиваются до выбаранной точки
                before.push(interval)
            } else if(interval.from > selectedPointIndex){//начинаются после выбранной точки
                after.push(interval)
            } else {
                covering.push(interval);
            }
        });

        if(covering.length == 0){//не попали ни на один интервал
            return null;
        }
        covering.sort((a, b) =>  (a.to.getTime() - a.from.getTime()) - (b.to.getTime() - b.from.getTime()));//Начиная с самых коротких

        var cur = before.length;
        return new ArraySequence(before.concat(covering).concat(after));
    }

    static libUrl:string;

    static getUrl(path:string): string{
        if(!this.libUrl){
            const script =  document.currentScript || document.querySelector('script[src*="myrout.js"]');
            // @ts-ignore
            const libUrl = script.src;
            this.libUrl = libUrl.split('myrout.js')[0];
            if(!this.libUrl){
                throw new Error("libUrl not found" )
            }
        }
        return this.libUrl + path;
    }
    static toMoment(date:Date){
        return moment(date).utcOffset(Settings.utcOffset)
    }

    static parseDate( date:string): Date {
      return  new Date( moment.utc(date).valueOf() - Settings.utcOffset*60000)
    }

}