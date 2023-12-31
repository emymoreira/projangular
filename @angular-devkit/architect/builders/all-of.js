"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const src_1 = require("../src");
exports.default = (0, src_1.createBuilder)((options, context) => {
    const allRuns = [];
    context.reportProgress(0, (options.targets ? options.targets.length : 0) +
        (options.builders ? options.builders.length : 0));
    if (options.targets) {
        allRuns.push(...options.targets.map(({ target: targetStr, overrides }, i) => {
            const [project, target, configuration] = targetStr.split(/:/g, 3);
            return context
                .scheduleTarget({ project, target, configuration }, overrides || {})
                .then((run) => [i, run]);
        }));
    }
    if (options.builders) {
        allRuns.push(...options.builders.map(({ builder, options }, i) => {
            return context
                .scheduleBuilder(builder, options || {})
                .then((run) => [i, run]);
        }));
    }
    const allResults = allRuns.map(() => null);
    let n = 0;
    context.reportProgress(n++, allRuns.length);
    return (0, rxjs_1.from)(allRuns).pipe((0, rxjs_1.mergeMap)((runPromise) => (0, rxjs_1.from)(runPromise)), (0, rxjs_1.mergeMap)(([i, run]) => run.output.pipe((0, rxjs_1.map)((output) => [i, output]))), (0, rxjs_1.mergeMap)(([i, output]) => {
        allResults[i] = output;
        context.reportProgress(n++, allRuns.length);
        if (allResults.some((x) => x === null)) {
            // Some builders aren't done running yet.
            return rxjs_1.EMPTY;
        }
        else {
            return (0, rxjs_1.of)({
                success: allResults.every((x) => (x ? x.success : false)),
            });
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLW9mLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYXJjaGl0ZWN0L2J1aWxkZXJzL2FsbC1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUdILCtCQUFzRDtBQUN0RCxnQ0FBa0U7QUFHbEUsa0JBQWUsSUFBQSxtQkFBYSxFQUFtQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNsRixNQUFNLE9BQU8sR0FBb0MsRUFBRSxDQUFDO0lBRXBELE9BQU8sQ0FBQyxjQUFjLENBQ3BCLENBQUMsRUFDRCxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQ25ELENBQUM7SUFFRixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7UUFDbkIsT0FBTyxDQUFDLElBQUksQ0FDVixHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzdELE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxFLE9BQU8sT0FBTztpQkFDWCxjQUFjLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxFQUFFLFNBQVMsSUFBSSxFQUFFLENBQUM7aUJBQ25FLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUF5QixDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQ0gsQ0FBQztLQUNIO0lBRUQsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1FBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQ1YsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2xELE9BQU8sT0FBTztpQkFDWCxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUM7aUJBQ3ZDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUF5QixDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQ0gsQ0FBQztLQUNIO0lBRUQsTUFBTSxVQUFVLEdBQTZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFNUMsT0FBTyxJQUFBLFdBQUksRUFBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQ3ZCLElBQUEsZUFBUSxFQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFBLFdBQUksRUFBQyxVQUFVLENBQUMsQ0FBQyxFQUMxQyxJQUFBLGVBQVEsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FDcEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBQSxVQUFHLEVBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBNEIsQ0FBQyxDQUFDLENBQ3pFLEVBQ0QsSUFBQSxlQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFO1FBQ3ZCLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7UUFDdkIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUU7WUFDdEMseUNBQXlDO1lBQ3pDLE9BQU8sWUFBSyxDQUFDO1NBQ2Q7YUFBTTtZQUNMLE9BQU8sSUFBQSxTQUFFLEVBQUM7Z0JBQ1IsT0FBTyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMxRCxDQUFDLENBQUM7U0FDSjtJQUNILENBQUMsQ0FBQyxDQUNILENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqc29uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgRU1QVFksIGZyb20sIG1hcCwgbWVyZ2VNYXAsIG9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBCdWlsZGVyT3V0cHV0LCBCdWlsZGVyUnVuLCBjcmVhdGVCdWlsZGVyIH0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7IFNjaGVtYSBhcyBPcGVyYXRvclNjaGVtYSB9IGZyb20gJy4vb3BlcmF0b3Itc2NoZW1hJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlQnVpbGRlcjxqc29uLkpzb25PYmplY3QgJiBPcGVyYXRvclNjaGVtYT4oKG9wdGlvbnMsIGNvbnRleHQpID0+IHtcbiAgY29uc3QgYWxsUnVuczogUHJvbWlzZTxbbnVtYmVyLCBCdWlsZGVyUnVuXT5bXSA9IFtdO1xuXG4gIGNvbnRleHQucmVwb3J0UHJvZ3Jlc3MoXG4gICAgMCxcbiAgICAob3B0aW9ucy50YXJnZXRzID8gb3B0aW9ucy50YXJnZXRzLmxlbmd0aCA6IDApICtcbiAgICAgIChvcHRpb25zLmJ1aWxkZXJzID8gb3B0aW9ucy5idWlsZGVycy5sZW5ndGggOiAwKSxcbiAgKTtcblxuICBpZiAob3B0aW9ucy50YXJnZXRzKSB7XG4gICAgYWxsUnVucy5wdXNoKFxuICAgICAgLi4ub3B0aW9ucy50YXJnZXRzLm1hcCgoeyB0YXJnZXQ6IHRhcmdldFN0ciwgb3ZlcnJpZGVzIH0sIGkpID0+IHtcbiAgICAgICAgY29uc3QgW3Byb2plY3QsIHRhcmdldCwgY29uZmlndXJhdGlvbl0gPSB0YXJnZXRTdHIuc3BsaXQoLzovZywgMyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRleHRcbiAgICAgICAgICAuc2NoZWR1bGVUYXJnZXQoeyBwcm9qZWN0LCB0YXJnZXQsIGNvbmZpZ3VyYXRpb24gfSwgb3ZlcnJpZGVzIHx8IHt9KVxuICAgICAgICAgIC50aGVuKChydW4pID0+IFtpLCBydW5dIGFzIFtudW1iZXIsIEJ1aWxkZXJSdW5dKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5idWlsZGVycykge1xuICAgIGFsbFJ1bnMucHVzaChcbiAgICAgIC4uLm9wdGlvbnMuYnVpbGRlcnMubWFwKCh7IGJ1aWxkZXIsIG9wdGlvbnMgfSwgaSkgPT4ge1xuICAgICAgICByZXR1cm4gY29udGV4dFxuICAgICAgICAgIC5zY2hlZHVsZUJ1aWxkZXIoYnVpbGRlciwgb3B0aW9ucyB8fCB7fSlcbiAgICAgICAgICAudGhlbigocnVuKSA9PiBbaSwgcnVuXSBhcyBbbnVtYmVyLCBCdWlsZGVyUnVuXSk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgYWxsUmVzdWx0czogKEJ1aWxkZXJPdXRwdXQgfCBudWxsKVtdID0gYWxsUnVucy5tYXAoKCkgPT4gbnVsbCk7XG4gIGxldCBuID0gMDtcbiAgY29udGV4dC5yZXBvcnRQcm9ncmVzcyhuKyssIGFsbFJ1bnMubGVuZ3RoKTtcblxuICByZXR1cm4gZnJvbShhbGxSdW5zKS5waXBlKFxuICAgIG1lcmdlTWFwKChydW5Qcm9taXNlKSA9PiBmcm9tKHJ1blByb21pc2UpKSxcbiAgICBtZXJnZU1hcCgoW2ksIHJ1bl0pID0+XG4gICAgICBydW4ub3V0cHV0LnBpcGUobWFwKChvdXRwdXQpID0+IFtpLCBvdXRwdXRdIGFzIFtudW1iZXIsIEJ1aWxkZXJPdXRwdXRdKSksXG4gICAgKSxcbiAgICBtZXJnZU1hcCgoW2ksIG91dHB1dF0pID0+IHtcbiAgICAgIGFsbFJlc3VsdHNbaV0gPSBvdXRwdXQ7XG4gICAgICBjb250ZXh0LnJlcG9ydFByb2dyZXNzKG4rKywgYWxsUnVucy5sZW5ndGgpO1xuXG4gICAgICBpZiAoYWxsUmVzdWx0cy5zb21lKCh4KSA9PiB4ID09PSBudWxsKSkge1xuICAgICAgICAvLyBTb21lIGJ1aWxkZXJzIGFyZW4ndCBkb25lIHJ1bm5pbmcgeWV0LlxuICAgICAgICByZXR1cm4gRU1QVFk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gb2Yoe1xuICAgICAgICAgIHN1Y2Nlc3M6IGFsbFJlc3VsdHMuZXZlcnkoKHgpID0+ICh4ID8geC5zdWNjZXNzIDogZmFsc2UpKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSksXG4gICk7XG59KTtcbiJdfQ==