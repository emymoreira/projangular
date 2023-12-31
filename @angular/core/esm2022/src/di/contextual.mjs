/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { setInjectorProfilerContext } from '../render3/debug/injector_profiler';
import { getCurrentInjector, setCurrentInjector } from './injector_compatibility';
import { getInjectImplementation, setInjectImplementation } from './inject_switch';
import { R3Injector } from './r3_injector';
/**
 * Runs the given function in the [context](guide/dependency-injection-context) of the given
 * `Injector`.
 *
 * Within the function's stack frame, [`inject`](api/core/inject) can be used to inject dependencies
 * from the given `Injector`. Note that `inject` is only usable synchronously, and cannot be used in
 * any asynchronous callbacks or after any `await` points.
 *
 * @param injector the injector which will satisfy calls to [`inject`](api/core/inject) while `fn`
 *     is executing
 * @param fn the closure to be run in the context of `injector`
 * @returns the return value of the function, if any
 * @publicApi
 */
export function runInInjectionContext(injector, fn) {
    if (injector instanceof R3Injector) {
        injector.assertNotDestroyed();
    }
    let prevInjectorProfilerContext;
    if (ngDevMode) {
        prevInjectorProfilerContext = setInjectorProfilerContext({ injector, token: null });
    }
    const prevInjector = setCurrentInjector(injector);
    const previousInjectImplementation = setInjectImplementation(undefined);
    try {
        return fn();
    }
    finally {
        setCurrentInjector(prevInjector);
        ngDevMode && setInjectorProfilerContext(prevInjectorProfilerContext);
        setInjectImplementation(previousInjectImplementation);
    }
}
/**
 * Asserts that the current stack frame is within an [injection
 * context](guide/dependency-injection-context) and has access to `inject`.
 *
 * @param debugFn a reference to the function making the assertion (used for the error message).
 *
 * @publicApi
 */
export function assertInInjectionContext(debugFn) {
    // Taking a `Function` instead of a string name here prevents the unminified name of the function
    // from being retained in the bundle regardless of minification.
    if (!getInjectImplementation() && !getCurrentInjector()) {
        throw new RuntimeError(-203 /* RuntimeErrorCode.MISSING_INJECTION_CONTEXT */, ngDevMode &&
            (debugFn.name +
                '() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`'));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dHVhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2NvbnRleHR1YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUEwQiwwQkFBMEIsRUFBQyxNQUFNLG9DQUFvQyxDQUFDO0FBRXZHLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ2pGLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFekM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBVSxRQUFrQixFQUFFLEVBQWlCO0lBQ2xGLElBQUksUUFBUSxZQUFZLFVBQVUsRUFBRTtRQUNsQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztLQUMvQjtJQUVELElBQUksMkJBQW9ELENBQUM7SUFDekQsSUFBSSxTQUFTLEVBQUU7UUFDYiwyQkFBMkIsR0FBRywwQkFBMEIsQ0FBQyxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztLQUNuRjtJQUNELE1BQU0sWUFBWSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sNEJBQTRCLEdBQUcsdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDeEUsSUFBSTtRQUNGLE9BQU8sRUFBRSxFQUFFLENBQUM7S0FDYjtZQUFTO1FBQ1Isa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDakMsU0FBUyxJQUFJLDBCQUEwQixDQUFDLDJCQUE0QixDQUFDLENBQUM7UUFDdEUsdUJBQXVCLENBQUMsNEJBQTRCLENBQUMsQ0FBQztLQUN2RDtBQUNILENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLHdCQUF3QixDQUFDLE9BQWlCO0lBQ3hELGlHQUFpRztJQUNqRyxnRUFBZ0U7SUFDaEUsSUFBSSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFO1FBQ3ZELE1BQU0sSUFBSSxZQUFZLHdEQUVsQixTQUFTO1lBQ0wsQ0FBQyxPQUFPLENBQUMsSUFBSTtnQkFDWixpS0FBaUssQ0FBQyxDQUFDLENBQUM7S0FDOUs7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtJbmplY3RvclByb2ZpbGVyQ29udGV4dCwgc2V0SW5qZWN0b3JQcm9maWxlckNvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvZGVidWcvaW5qZWN0b3JfcHJvZmlsZXInO1xuaW1wb3J0IHR5cGUge0luamVjdG9yfSBmcm9tICcuL2luamVjdG9yJztcbmltcG9ydCB7Z2V0Q3VycmVudEluamVjdG9yLCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2dldEluamVjdEltcGxlbWVudGF0aW9uLCBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbn0gZnJvbSAnLi9pbmplY3Rfc3dpdGNoJztcbmltcG9ydCB7UjNJbmplY3Rvcn0gZnJvbSAnLi9yM19pbmplY3Rvcic7XG5cbi8qKlxuICogUnVucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gaW4gdGhlIFtjb250ZXh0XShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbi1jb250ZXh0KSBvZiB0aGUgZ2l2ZW5cbiAqIGBJbmplY3RvcmAuXG4gKlxuICogV2l0aGluIHRoZSBmdW5jdGlvbidzIHN0YWNrIGZyYW1lLCBbYGluamVjdGBdKGFwaS9jb3JlL2luamVjdCkgY2FuIGJlIHVzZWQgdG8gaW5qZWN0IGRlcGVuZGVuY2llc1xuICogZnJvbSB0aGUgZ2l2ZW4gYEluamVjdG9yYC4gTm90ZSB0aGF0IGBpbmplY3RgIGlzIG9ubHkgdXNhYmxlIHN5bmNocm9ub3VzbHksIGFuZCBjYW5ub3QgYmUgdXNlZCBpblxuICogYW55IGFzeW5jaHJvbm91cyBjYWxsYmFja3Mgb3IgYWZ0ZXIgYW55IGBhd2FpdGAgcG9pbnRzLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciB0aGUgaW5qZWN0b3Igd2hpY2ggd2lsbCBzYXRpc2Z5IGNhbGxzIHRvIFtgaW5qZWN0YF0oYXBpL2NvcmUvaW5qZWN0KSB3aGlsZSBgZm5gXG4gKiAgICAgaXMgZXhlY3V0aW5nXG4gKiBAcGFyYW0gZm4gdGhlIGNsb3N1cmUgdG8gYmUgcnVuIGluIHRoZSBjb250ZXh0IG9mIGBpbmplY3RvcmBcbiAqIEByZXR1cm5zIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uLCBpZiBhbnlcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJ1bkluSW5qZWN0aW9uQ29udGV4dDxSZXR1cm5UPihpbmplY3RvcjogSW5qZWN0b3IsIGZuOiAoKSA9PiBSZXR1cm5UKTogUmV0dXJuVCB7XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIFIzSW5qZWN0b3IpIHtcbiAgICBpbmplY3Rvci5hc3NlcnROb3REZXN0cm95ZWQoKTtcbiAgfVxuXG4gIGxldCBwcmV2SW5qZWN0b3JQcm9maWxlckNvbnRleHQ6IEluamVjdG9yUHJvZmlsZXJDb250ZXh0O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgcHJldkluamVjdG9yUHJvZmlsZXJDb250ZXh0ID0gc2V0SW5qZWN0b3JQcm9maWxlckNvbnRleHQoe2luamVjdG9yLCB0b2tlbjogbnVsbH0pO1xuICB9XG4gIGNvbnN0IHByZXZJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3RvcihpbmplY3Rvcik7XG4gIGNvbnN0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24gPSBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbih1bmRlZmluZWQpO1xuICB0cnkge1xuICAgIHJldHVybiBmbigpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEN1cnJlbnRJbmplY3RvcihwcmV2SW5qZWN0b3IpO1xuICAgIG5nRGV2TW9kZSAmJiBzZXRJbmplY3RvclByb2ZpbGVyQ29udGV4dChwcmV2SW5qZWN0b3JQcm9maWxlckNvbnRleHQhKTtcbiAgICBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uKTtcbiAgfVxufVxuXG4vKipcbiAqIEFzc2VydHMgdGhhdCB0aGUgY3VycmVudCBzdGFjayBmcmFtZSBpcyB3aXRoaW4gYW4gW2luamVjdGlvblxuICogY29udGV4dF0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24tY29udGV4dCkgYW5kIGhhcyBhY2Nlc3MgdG8gYGluamVjdGAuXG4gKlxuICogQHBhcmFtIGRlYnVnRm4gYSByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIG1ha2luZyB0aGUgYXNzZXJ0aW9uICh1c2VkIGZvciB0aGUgZXJyb3IgbWVzc2FnZSkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGRlYnVnRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIC8vIFRha2luZyBhIGBGdW5jdGlvbmAgaW5zdGVhZCBvZiBhIHN0cmluZyBuYW1lIGhlcmUgcHJldmVudHMgdGhlIHVubWluaWZpZWQgbmFtZSBvZiB0aGUgZnVuY3Rpb25cbiAgLy8gZnJvbSBiZWluZyByZXRhaW5lZCBpbiB0aGUgYnVuZGxlIHJlZ2FyZGxlc3Mgb2YgbWluaWZpY2F0aW9uLlxuICBpZiAoIWdldEluamVjdEltcGxlbWVudGF0aW9uKCkgJiYgIWdldEN1cnJlbnRJbmplY3RvcigpKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX0lOSkVDVElPTl9DT05URVhULFxuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIChkZWJ1Z0ZuLm5hbWUgK1xuICAgICAgICAgICAgICcoKSBjYW4gb25seSBiZSB1c2VkIHdpdGhpbiBhbiBpbmplY3Rpb24gY29udGV4dCBzdWNoIGFzIGEgY29uc3RydWN0b3IsIGEgZmFjdG9yeSBmdW5jdGlvbiwgYSBmaWVsZCBpbml0aWFsaXplciwgb3IgYSBmdW5jdGlvbiB1c2VkIHdpdGggYHJ1bkluSW5qZWN0aW9uQ29udGV4dGAnKSk7XG4gIH1cbn1cbiJdfQ==