/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext, DestroyRef, effect, inject, Injector, untracked } from '@angular/core';
import { ReplaySubject } from 'rxjs';
/**
 * Exposes the value of an Angular `Signal` as an RxJS `Observable`.
 *
 * The signal's value will be propagated into the `Observable`'s subscribers using an `effect`.
 *
 * `toObservable` must be called in an injection context unless an injector is provided via options.
 *
 * @developerPreview
 */
export function toObservable(source, options) {
    !options?.injector && assertInInjectionContext(toObservable);
    const injector = options?.injector ?? inject(Injector);
    const subject = new ReplaySubject(1);
    const watcher = effect(() => {
        let value;
        try {
            value = source();
        }
        catch (err) {
            untracked(() => subject.error(err));
            return;
        }
        untracked(() => subject.next(value));
    }, { injector, manualCleanup: true });
    injector.get(DestroyRef).onDestroy(() => {
        watcher.destroy();
        subject.complete();
    });
    return subject.asObservable();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9fb2JzZXJ2YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcnhqcy1pbnRlcm9wL3NyYy90b19vYnNlcnZhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFhLE1BQU0sRUFBRSxRQUFRLEVBQVUsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNILE9BQU8sRUFBYSxhQUFhLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFpQi9DOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FDeEIsTUFBaUIsRUFDakIsT0FBNkI7SUFFL0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxJQUFJLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzdELE1BQU0sUUFBUSxHQUFHLE9BQU8sRUFBRSxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sT0FBTyxHQUFHLElBQUksYUFBYSxDQUFJLENBQUMsQ0FBQyxDQUFDO0lBRXhDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEVBQUU7UUFDMUIsSUFBSSxLQUFRLENBQUM7UUFDYixJQUFJO1lBQ0YsS0FBSyxHQUFHLE1BQU0sRUFBRSxDQUFDO1NBQ2xCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE9BQU87U0FDUjtRQUNELFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDdkMsQ0FBQyxFQUFFLEVBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0lBRXBDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUN0QyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEIsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDaEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEluSW5qZWN0aW9uQ29udGV4dCwgRGVzdHJveVJlZiwgZWZmZWN0LCBFZmZlY3RSZWYsIGluamVjdCwgSW5qZWN0b3IsIFNpZ25hbCwgdW50cmFja2VkfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgYHRvT2JzZXJ2YWJsZWAuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUb09ic2VydmFibGVPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSB3aGVuIGNyZWF0aW5nIHRoZSB1bmRlcmx5aW5nIGBlZmZlY3RgIHdoaWNoIHdhdGNoZXMgdGhlIHNpZ25hbC5cbiAgICpcbiAgICogSWYgdGhpcyBpc24ndCBzcGVjaWZpZWQsIHRoZSBjdXJyZW50IFtpbmplY3Rpb24gY29udGV4dF0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24tY29udGV4dClcbiAgICogd2lsbCBiZSB1c2VkLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3Rvcjtcbn1cblxuLyoqXG4gKiBFeHBvc2VzIHRoZSB2YWx1ZSBvZiBhbiBBbmd1bGFyIGBTaWduYWxgIGFzIGFuIFJ4SlMgYE9ic2VydmFibGVgLlxuICpcbiAqIFRoZSBzaWduYWwncyB2YWx1ZSB3aWxsIGJlIHByb3BhZ2F0ZWQgaW50byB0aGUgYE9ic2VydmFibGVgJ3Mgc3Vic2NyaWJlcnMgdXNpbmcgYW4gYGVmZmVjdGAuXG4gKlxuICogYHRvT2JzZXJ2YWJsZWAgbXVzdCBiZSBjYWxsZWQgaW4gYW4gaW5qZWN0aW9uIGNvbnRleHQgdW5sZXNzIGFuIGluamVjdG9yIGlzIHByb3ZpZGVkIHZpYSBvcHRpb25zLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b09ic2VydmFibGU8VD4oXG4gICAgc291cmNlOiBTaWduYWw8VD4sXG4gICAgb3B0aW9ucz86IFRvT2JzZXJ2YWJsZU9wdGlvbnMsXG4gICAgKTogT2JzZXJ2YWJsZTxUPiB7XG4gICFvcHRpb25zPy5pbmplY3RvciAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQodG9PYnNlcnZhYmxlKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuICBjb25zdCBzdWJqZWN0ID0gbmV3IFJlcGxheVN1YmplY3Q8VD4oMSk7XG5cbiAgY29uc3Qgd2F0Y2hlciA9IGVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IHZhbHVlOiBUO1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IHNvdXJjZSgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdW50cmFja2VkKCgpID0+IHN1YmplY3QuZXJyb3IoZXJyKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVudHJhY2tlZCgoKSA9PiBzdWJqZWN0Lm5leHQodmFsdWUpKTtcbiAgfSwge2luamVjdG9yLCBtYW51YWxDbGVhbnVwOiB0cnVlfSk7XG5cbiAgaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveSgoKSA9PiB7XG4gICAgd2F0Y2hlci5kZXN0cm95KCk7XG4gICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICB9KTtcblxuICByZXR1cm4gc3ViamVjdC5hc09ic2VydmFibGUoKTtcbn1cbiJdfQ==