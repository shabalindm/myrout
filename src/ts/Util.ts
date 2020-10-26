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



    static getUrl(path:string): string{
        return Settings.libUrl + path;
    }
    static toMoment(date:Date){
        return moment(date).utcOffset(Settings.utcOffset)
    }

    static parseDate( date:string): Date {
      return  new Date( moment.utc(date).valueOf() - Settings.utcOffset*60000)
    }

    static httpGet(url:string) {

        return new Promise(function(resolve, reject) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            xhr.onload = function() {
                if (this.status == 200) {
                    resolve(this.responseText);
                } else {
                    var error = new Error(this.statusText);
                    // @ts-ignore
                    error.code = this.status;
                    reject(error);
                }
            };

            xhr.onerror = function() {
                reject(new Error("Network Error"));
            };

            xhr.send();
        });

    }

    static format(template: string, args:any){
        var formatted = template;

        for (const [key, value] of Object.entries(args)) {
            // @ts-ignore
            formatted = formatted.replace("${" + key + "}", value);
        }
        return formatted;
    }

}