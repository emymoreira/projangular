/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EnvironmentInjector, inject, Injectable, InjectionToken, ɵInitialRenderPendingTasks as InitialRenderPendingTasks } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { HttpBackend, HttpHandler } from './backend';
import * as i0 from "@angular/core";
import * as i1 from "./backend";
function interceptorChainEndFn(req, finalHandlerFn) {
    return finalHandlerFn(req);
}
/**
 * Constructs a `ChainedInterceptorFn` which adapts a legacy `HttpInterceptor` to the
 * `ChainedInterceptorFn` interface.
 */
function adaptLegacyInterceptorToChain(chainTailFn, interceptor) {
    return (initialRequest, finalHandlerFn) => interceptor.intercept(initialRequest, {
        handle: (downstreamRequest) => chainTailFn(downstreamRequest, finalHandlerFn),
    });
}
/**
 * Constructs a `ChainedInterceptorFn` which wraps and invokes a functional interceptor in the given
 * injector.
 */
function chainedInterceptorFn(chainTailFn, interceptorFn, injector) {
    // clang-format off
    return (initialRequest, finalHandlerFn) => injector.runInContext(() => interceptorFn(initialRequest, downstreamRequest => chainTailFn(downstreamRequest, finalHandlerFn)));
    // clang-format on
}
/**
 * A multi-provider token that represents the array of registered
 * `HttpInterceptor` objects.
 *
 * @publicApi
 */
export const HTTP_INTERCEPTORS = new InjectionToken(ngDevMode ? 'HTTP_INTERCEPTORS' : '');
/**
 * A multi-provided token of `HttpInterceptorFn`s.
 */
export const HTTP_INTERCEPTOR_FNS = new InjectionToken(ngDevMode ? 'HTTP_INTERCEPTOR_FNS' : '');
/**
 * A multi-provided token of `HttpInterceptorFn`s that are only set in root.
 */
export const HTTP_ROOT_INTERCEPTOR_FNS = new InjectionToken(ngDevMode ? 'HTTP_ROOT_INTERCEPTOR_FNS' : '');
/**
 * Creates an `HttpInterceptorFn` which lazily initializes an interceptor chain from the legacy
 * class-based interceptors and runs the request through it.
 */
export function legacyInterceptorFnFactory() {
    let chain = null;
    return (req, handler) => {
        if (chain === null) {
            const interceptors = inject(HTTP_INTERCEPTORS, { optional: true }) ?? [];
            // Note: interceptors are wrapped right-to-left so that final execution order is
            // left-to-right. That is, if `interceptors` is the array `[a, b, c]`, we want to
            // produce a chain that is conceptually `c(b(a(end)))`, which we build from the inside
            // out.
            chain = interceptors.reduceRight(adaptLegacyInterceptorToChain, interceptorChainEndFn);
        }
        const pendingTasks = inject(InitialRenderPendingTasks);
        const taskId = pendingTasks.add();
        return chain(req, handler).pipe(finalize(() => pendingTasks.remove(taskId)));
    };
}
export class HttpInterceptorHandler extends HttpHandler {
    constructor(backend, injector) {
        super();
        this.backend = backend;
        this.injector = injector;
        this.chain = null;
        this.pendingTasks = inject(InitialRenderPendingTasks);
    }
    handle(initialRequest) {
        if (this.chain === null) {
            const dedupedInterceptorFns = Array.from(new Set([
                ...this.injector.get(HTTP_INTERCEPTOR_FNS),
                ...this.injector.get(HTTP_ROOT_INTERCEPTOR_FNS, []),
            ]));
            // Note: interceptors are wrapped right-to-left so that final execution order is
            // left-to-right. That is, if `dedupedInterceptorFns` is the array `[a, b, c]`, we want to
            // produce a chain that is conceptually `c(b(a(end)))`, which we build from the inside
            // out.
            this.chain = dedupedInterceptorFns.reduceRight((nextSequencedFn, interceptorFn) => chainedInterceptorFn(nextSequencedFn, interceptorFn, this.injector), interceptorChainEndFn);
        }
        const taskId = this.pendingTasks.add();
        return this.chain(initialRequest, downstreamRequest => this.backend.handle(downstreamRequest))
            .pipe(finalize(() => this.pendingTasks.remove(taskId)));
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.1", ngImport: i0, type: HttpInterceptorHandler, deps: [{ token: i1.HttpBackend }, { token: i0.EnvironmentInjector }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.1", ngImport: i0, type: HttpInterceptorHandler }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.1", ngImport: i0, type: HttpInterceptorHandler, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i1.HttpBackend }, { type: i0.EnvironmentInjector }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vaHR0cC9zcmMvaW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLDBCQUEwQixJQUFJLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRS9JLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QyxPQUFPLEVBQUMsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQzs7O0FBNEhuRCxTQUFTLHFCQUFxQixDQUMxQixHQUFxQixFQUFFLGNBQTZCO0lBQ3RELE9BQU8sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLDZCQUE2QixDQUNsQyxXQUFzQyxFQUN0QyxXQUE0QjtJQUM5QixPQUFPLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUU7UUFDL0UsTUFBTSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUM7S0FDOUUsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsb0JBQW9CLENBQ3pCLFdBQTBDLEVBQUUsYUFBZ0MsRUFDNUUsUUFBNkI7SUFDL0IsbUJBQW1CO0lBQ25CLE9BQU8sQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUNwRSxhQUFhLENBQ1gsY0FBYyxFQUNkLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUUs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QUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDekYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQzt5SEE1QlUsc0JBQXNCOzZIQUF0QixzQkFBc0I7O3NHQUF0QixzQkFBc0I7a0JBRGxDLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yLCBpbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCDJtUluaXRpYWxSZW5kZXJQZW5kaW5nVGFza3MgYXMgSW5pdGlhbFJlbmRlclBlbmRpbmdUYXNrc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaW5hbGl6ZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0h0dHBCYWNrZW5kLCBIdHRwSGFuZGxlcn0gZnJvbSAnLi9iYWNrZW5kJztcbmltcG9ydCB7SHR0cFJlcXVlc3R9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQge0h0dHBFdmVudH0gZnJvbSAnLi9yZXNwb25zZSc7XG5cbi8qKlxuICogSW50ZXJjZXB0cyBhbmQgaGFuZGxlcyBhbiBgSHR0cFJlcXVlc3RgIG9yIGBIdHRwUmVzcG9uc2VgLlxuICpcbiAqIE1vc3QgaW50ZXJjZXB0b3JzIHRyYW5zZm9ybSB0aGUgb3V0Z29pbmcgcmVxdWVzdCBiZWZvcmUgcGFzc2luZyBpdCB0byB0aGVcbiAqIG5leHQgaW50ZXJjZXB0b3IgaW4gdGhlIGNoYWluLCBieSBjYWxsaW5nIGBuZXh0LmhhbmRsZSh0cmFuc2Zvcm1lZFJlcSlgLlxuICogQW4gaW50ZXJjZXB0b3IgbWF5IHRyYW5zZm9ybSB0aGVcbiAqIHJlc3BvbnNlIGV2ZW50IHN0cmVhbSBhcyB3ZWxsLCBieSBhcHBseWluZyBhZGRpdGlvbmFsIFJ4SlMgb3BlcmF0b3JzIG9uIHRoZSBzdHJlYW1cbiAqIHJldHVybmVkIGJ5IGBuZXh0LmhhbmRsZSgpYC5cbiAqXG4gKiBNb3JlIHJhcmVseSwgYW4gaW50ZXJjZXB0b3IgbWF5IGhhbmRsZSB0aGUgcmVxdWVzdCBlbnRpcmVseSxcbiAqIGFuZCBjb21wb3NlIGEgbmV3IGV2ZW50IHN0cmVhbSBpbnN0ZWFkIG9mIGludm9raW5nIGBuZXh0LmhhbmRsZSgpYC4gVGhpcyBpcyBhblxuICogYWNjZXB0YWJsZSBiZWhhdmlvciwgYnV0IGtlZXAgaW4gbWluZCB0aGF0IGZ1cnRoZXIgaW50ZXJjZXB0b3JzIHdpbGwgYmUgc2tpcHBlZCBlbnRpcmVseS5cbiAqXG4gKiBJdCBpcyBhbHNvIHJhcmUgYnV0IHZhbGlkIGZvciBhbiBpbnRlcmNlcHRvciB0byByZXR1cm4gbXVsdGlwbGUgcmVzcG9uc2VzIG9uIHRoZVxuICogZXZlbnQgc3RyZWFtIGZvciBhIHNpbmdsZSByZXF1ZXN0LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqXG4gKiBAc2VlIFtIVFRQIEd1aWRlXShndWlkZS9odHRwLWludGVyY2VwdC1yZXF1ZXN0cy1hbmQtcmVzcG9uc2VzKVxuICogQHNlZSB7QGxpbmsgSHR0cEludGVyY2VwdG9yRm59XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUbyB1c2UgdGhlIHNhbWUgaW5zdGFuY2Ugb2YgYEh0dHBJbnRlcmNlcHRvcnNgIGZvciB0aGUgZW50aXJlIGFwcCwgaW1wb3J0IHRoZSBgSHR0cENsaWVudE1vZHVsZWBcbiAqIG9ubHkgaW4geW91ciBgQXBwTW9kdWxlYCwgYW5kIGFkZCB0aGUgaW50ZXJjZXB0b3JzIHRvIHRoZSByb290IGFwcGxpY2F0aW9uIGluamVjdG9yLlxuICogSWYgeW91IGltcG9ydCBgSHR0cENsaWVudE1vZHVsZWAgbXVsdGlwbGUgdGltZXMgYWNyb3NzIGRpZmZlcmVudCBtb2R1bGVzIChmb3IgZXhhbXBsZSwgaW4gbGF6eVxuICogbG9hZGluZyBtb2R1bGVzKSwgZWFjaCBpbXBvcnQgY3JlYXRlcyBhIG5ldyBjb3B5IG9mIHRoZSBgSHR0cENsaWVudE1vZHVsZWAsIHdoaWNoIG92ZXJ3cml0ZXMgdGhlXG4gKiBpbnRlcmNlcHRvcnMgcHJvdmlkZWQgaW4gdGhlIHJvb3QgbW9kdWxlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEh0dHBJbnRlcmNlcHRvciB7XG4gIC8qKlxuICAgKiBJZGVudGlmaWVzIGFuZCBoYW5kbGVzIGEgZ2l2ZW4gSFRUUCByZXF1ZXN0LlxuICAgKiBAcGFyYW0gcmVxIFRoZSBvdXRnb2luZyByZXF1ZXN0IG9iamVjdCB0byBoYW5kbGUuXG4gICAqIEBwYXJhbSBuZXh0IFRoZSBuZXh0IGludGVyY2VwdG9yIGluIHRoZSBjaGFpbiwgb3IgdGhlIGJhY2tlbmRcbiAgICogaWYgbm8gaW50ZXJjZXB0b3JzIHJlbWFpbiBpbiB0aGUgY2hhaW4uXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgb2YgdGhlIGV2ZW50IHN0cmVhbS5cbiAgICovXG4gIGludGVyY2VwdChyZXE6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj47XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgbmV4dCBpbnRlcmNlcHRvciBpbiBhbiBpbnRlcmNlcHRvciBjaGFpbiwgb3IgdGhlIHJlYWwgYmFja2VuZCBpZiB0aGVyZSBhcmUgbm9cbiAqIGZ1cnRoZXIgaW50ZXJjZXB0b3JzLlxuICpcbiAqIE1vc3QgaW50ZXJjZXB0b3JzIHdpbGwgZGVsZWdhdGUgdG8gdGhpcyBmdW5jdGlvbiwgYW5kIGVpdGhlciBtb2RpZnkgdGhlIG91dGdvaW5nIHJlcXVlc3Qgb3IgdGhlXG4gKiByZXNwb25zZSB3aGVuIGl0IGFycml2ZXMuIFdpdGhpbiB0aGUgc2NvcGUgb2YgdGhlIGN1cnJlbnQgcmVxdWVzdCwgaG93ZXZlciwgdGhpcyBmdW5jdGlvbiBtYXkgYmVcbiAqIGNhbGxlZCBhbnkgbnVtYmVyIG9mIHRpbWVzLCBmb3IgYW55IG51bWJlciBvZiBkb3duc3RyZWFtIHJlcXVlc3RzLiBTdWNoIGRvd25zdHJlYW0gcmVxdWVzdHMgbmVlZFxuICogbm90IGJlIHRvIHRoZSBzYW1lIFVSTCBvciBldmVuIHRoZSBzYW1lIG9yaWdpbiBhcyB0aGUgY3VycmVudCByZXF1ZXN0LiBJdCBpcyBhbHNvIHZhbGlkIHRvIG5vdFxuICogY2FsbCB0aGUgZG93bnN0cmVhbSBoYW5kbGVyIGF0IGFsbCwgYW5kIHByb2Nlc3MgdGhlIGN1cnJlbnQgcmVxdWVzdCBlbnRpcmVseSB3aXRoaW4gdGhlXG4gKiBpbnRlcmNlcHRvci5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBvbmx5IGJlIGNhbGxlZCB3aXRoaW4gdGhlIHNjb3BlIG9mIHRoZSByZXF1ZXN0IHRoYXQncyBjdXJyZW50bHkgYmVpbmdcbiAqIGludGVyY2VwdGVkLiBPbmNlIHRoYXQgcmVxdWVzdCBpcyBjb21wbGV0ZSwgdGhpcyBkb3duc3RyZWFtIGhhbmRsZXIgZnVuY3Rpb24gc2hvdWxkIG5vdCBiZVxuICogY2FsbGVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqXG4gKiBAc2VlIFtIVFRQIEd1aWRlXShndWlkZS9odHRwLWludGVyY2VwdC1yZXF1ZXN0cy1hbmQtcmVzcG9uc2VzKVxuICovXG5leHBvcnQgdHlwZSBIdHRwSGFuZGxlckZuID0gKHJlcTogSHR0cFJlcXVlc3Q8dW5rbm93bj4pID0+IE9ic2VydmFibGU8SHR0cEV2ZW50PHVua25vd24+PjtcblxuLyoqXG4gKiBBbiBpbnRlcmNlcHRvciBmb3IgSFRUUCByZXF1ZXN0cyBtYWRlIHZpYSBgSHR0cENsaWVudGAuXG4gKlxuICogYEh0dHBJbnRlcmNlcHRvckZuYHMgYXJlIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHdoaWNoIGBIdHRwQ2xpZW50YCBjYWxscyB3aGVuIGEgcmVxdWVzdCBpcyBtYWRlLlxuICogVGhlc2UgZnVuY3Rpb25zIGhhdmUgdGhlIG9wcG9ydHVuaXR5IHRvIG1vZGlmeSB0aGUgb3V0Z29pbmcgcmVxdWVzdCBvciBhbnkgcmVzcG9uc2UgdGhhdCBjb21lc1xuICogYmFjaywgYXMgd2VsbCBhcyBibG9jaywgcmVkaXJlY3QsIG9yIG90aGVyd2lzZSBjaGFuZ2UgdGhlIHJlcXVlc3Qgb3IgcmVzcG9uc2Ugc2VtYW50aWNzLlxuICpcbiAqIEFuIGBIdHRwSGFuZGxlckZuYCByZXByZXNlbnRpbmcgdGhlIG5leHQgaW50ZXJjZXB0b3IgKG9yIHRoZSBiYWNrZW5kIHdoaWNoIHdpbGwgbWFrZSBhIHJlYWwgSFRUUFxuICogcmVxdWVzdCkgaXMgcHJvdmlkZWQuIE1vc3QgaW50ZXJjZXB0b3JzIHdpbGwgZGVsZWdhdGUgdG8gdGhpcyBmdW5jdGlvbiwgYnV0IHRoYXQgaXMgbm90IHJlcXVpcmVkXG4gKiAoc2VlIGBIdHRwSGFuZGxlckZuYCBmb3IgbW9yZSBkZXRhaWxzKS5cbiAqXG4gKiBgSHR0cEludGVyY2VwdG9yRm5gcyBhcmUgZXhlY3V0ZWQgaW4gYW4gW2luamVjdGlvbiBjb250ZXh0XSgvZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24tY29udGV4dCkuXG4gKiBUaGV5IGhhdmUgYWNjZXNzIHRvIGBpbmplY3QoKWAgdmlhIHRoZSBgRW52aXJvbm1lbnRJbmplY3RvcmAgZnJvbSB3aGljaCB0aGV5IHdlcmUgY29uZmlndXJlZC5cbiAqXG4gKiBAc2VlIFtIVFRQIEd1aWRlXShndWlkZS9odHRwLWludGVyY2VwdC1yZXF1ZXN0cy1hbmQtcmVzcG9uc2VzKVxuICogQHNlZSB7QGxpbmsgd2l0aEludGVyY2VwdG9yc31cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogSGVyZSBpcyBhIG5vb3AgaW50ZXJjZXB0b3IgdGhhdCBwYXNzZXMgdGhlIHJlcXVlc3QgdGhyb3VnaCB3aXRob3V0IG1vZGlmeWluZyBpdDpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGV4cG9ydCBjb25zdCBub29wSW50ZXJjZXB0b3I6IEh0dHBJbnRlcmNlcHRvckZuID0gKHJlcTogSHR0cFJlcXVlc3Q8dW5rbm93bj4sIG5leHQ6XG4gKiBIdHRwSGFuZGxlckZuKSA9PiB7XG4gKiAgIHJldHVybiBuZXh0KG1vZGlmaWVkUmVxKTtcbiAqIH07XG4gKiBgYGBcbiAqXG4gKiBJZiB5b3Ugd2FudCB0byBhbHRlciBhIHJlcXVlc3QsIGNsb25lIGl0IGZpcnN0IGFuZCBtb2RpZnkgdGhlIGNsb25lIGJlZm9yZSBwYXNzaW5nIGl0IHRvIHRoZVxuICogYG5leHQoKWAgaGFuZGxlciBmdW5jdGlvbi5cbiAqXG4gKiBIZXJlIGlzIGEgYmFzaWMgaW50ZXJjZXB0b3IgdGhhdCBhZGRzIGEgYmVhcmVyIHRva2VuIHRvIHRoZSBoZWFkZXJzXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBleHBvcnQgY29uc3QgYXV0aGVudGljYXRpb25JbnRlcmNlcHRvcjogSHR0cEludGVyY2VwdG9yRm4gPSAocmVxOiBIdHRwUmVxdWVzdDx1bmtub3duPiwgbmV4dDpcbiAqIEh0dHBIYW5kbGVyRm4pID0+IHtcbiAqICAgIGNvbnN0IHVzZXJUb2tlbiA9ICdNWV9UT0tFTic7IGNvbnN0IG1vZGlmaWVkUmVxID0gcmVxLmNsb25lKHtcbiAqICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3VzZXJUb2tlbn1gKSxcbiAqICAgIH0pO1xuICpcbiAqICAgIHJldHVybiBuZXh0KG1vZGlmaWVkUmVxKTtcbiAqIH07XG4gKiBgYGBcbiAqL1xuZXhwb3J0IHR5cGUgSHR0cEludGVyY2VwdG9yRm4gPSAocmVxOiBIdHRwUmVxdWVzdDx1bmtub3duPiwgbmV4dDogSHR0cEhhbmRsZXJGbikgPT5cbiAgICBPYnNlcnZhYmxlPEh0dHBFdmVudDx1bmtub3duPj47XG5cbi8qKlxuICogRnVuY3Rpb24gd2hpY2ggaW52b2tlcyBhbiBIVFRQIGludGVyY2VwdG9yIGNoYWluLlxuICpcbiAqIEVhY2ggaW50ZXJjZXB0b3IgaW4gdGhlIGludGVyY2VwdG9yIGNoYWluIGlzIHR1cm5lZCBpbnRvIGEgYENoYWluZWRJbnRlcmNlcHRvckZuYCB3aGljaCBjbG9zZXNcbiAqIG92ZXIgdGhlIHJlc3Qgb2YgdGhlIGNoYWluIChyZXByZXNlbnRlZCBieSBhbm90aGVyIGBDaGFpbmVkSW50ZXJjZXB0b3JGbmApLiBUaGUgbGFzdCBzdWNoXG4gKiBmdW5jdGlvbiBpbiB0aGUgY2hhaW4gd2lsbCBpbnN0ZWFkIGRlbGVnYXRlIHRvIHRoZSBgZmluYWxIYW5kbGVyRm5gLCB3aGljaCBpcyBwYXNzZWQgZG93biB3aGVuXG4gKiB0aGUgY2hhaW4gaXMgaW52b2tlZC5cbiAqXG4gKiBUaGlzIHBhdHRlcm4gYWxsb3dzIGZvciBhIGNoYWluIG9mIG1hbnkgaW50ZXJjZXB0b3JzIHRvIGJlIGNvbXBvc2VkIGFuZCB3cmFwcGVkIGluIGEgc2luZ2xlXG4gKiBgSHR0cEludGVyY2VwdG9yRm5gLCB3aGljaCBpcyBhIHVzZWZ1bCBhYnN0cmFjdGlvbiBmb3IgaW5jbHVkaW5nIGRpZmZlcmVudCBraW5kcyBvZiBpbnRlcmNlcHRvcnNcbiAqIChlLmcuIGxlZ2FjeSBjbGFzcy1iYXNlZCBpbnRlcmNlcHRvcnMpIGluIHRoZSBzYW1lIGNoYWluLlxuICovXG50eXBlIENoYWluZWRJbnRlcmNlcHRvckZuPFJlcXVlc3RUPiA9IChyZXE6IEh0dHBSZXF1ZXN0PFJlcXVlc3RUPiwgZmluYWxIYW5kbGVyRm46IEh0dHBIYW5kbGVyRm4pID0+XG4gICAgT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8UmVxdWVzdFQ+PjtcblxuZnVuY3Rpb24gaW50ZXJjZXB0b3JDaGFpbkVuZEZuKFxuICAgIHJlcTogSHR0cFJlcXVlc3Q8YW55PiwgZmluYWxIYW5kbGVyRm46IEh0dHBIYW5kbGVyRm4pOiBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+PiB7XG4gIHJldHVybiBmaW5hbEhhbmRsZXJGbihyZXEpO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBgQ2hhaW5lZEludGVyY2VwdG9yRm5gIHdoaWNoIGFkYXB0cyBhIGxlZ2FjeSBgSHR0cEludGVyY2VwdG9yYCB0byB0aGVcbiAqIGBDaGFpbmVkSW50ZXJjZXB0b3JGbmAgaW50ZXJmYWNlLlxuICovXG5mdW5jdGlvbiBhZGFwdExlZ2FjeUludGVyY2VwdG9yVG9DaGFpbihcbiAgICBjaGFpblRhaWxGbjogQ2hhaW5lZEludGVyY2VwdG9yRm48YW55PixcbiAgICBpbnRlcmNlcHRvcjogSHR0cEludGVyY2VwdG9yKTogQ2hhaW5lZEludGVyY2VwdG9yRm48YW55PiB7XG4gIHJldHVybiAoaW5pdGlhbFJlcXVlc3QsIGZpbmFsSGFuZGxlckZuKSA9PiBpbnRlcmNlcHRvci5pbnRlcmNlcHQoaW5pdGlhbFJlcXVlc3QsIHtcbiAgICBoYW5kbGU6IChkb3duc3RyZWFtUmVxdWVzdCkgPT4gY2hhaW5UYWlsRm4oZG93bnN0cmVhbVJlcXVlc3QsIGZpbmFsSGFuZGxlckZuKSxcbiAgfSk7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGBDaGFpbmVkSW50ZXJjZXB0b3JGbmAgd2hpY2ggd3JhcHMgYW5kIGludm9rZXMgYSBmdW5jdGlvbmFsIGludGVyY2VwdG9yIGluIHRoZSBnaXZlblxuICogaW5qZWN0b3IuXG4gKi9cbmZ1bmN0aW9uIGNoYWluZWRJbnRlcmNlcHRvckZuKFxuICAgIGNoYWluVGFpbEZuOiBDaGFpbmVkSW50ZXJjZXB0b3JGbjx1bmtub3duPiwgaW50ZXJjZXB0b3JGbjogSHR0cEludGVyY2VwdG9yRm4sXG4gICAgaW5qZWN0b3I6IEVudmlyb25tZW50SW5qZWN0b3IpOiBDaGFpbmVkSW50ZXJjZXB0b3JGbjx1bmtub3duPiB7XG4gIC8vIGNsYW5nLWZvcm1hdCBvZmZcbiAgcmV0dXJuIChpbml0aWFsUmVxdWVzdCwgZmluYWxIYW5kbGVyRm4pID0+IGluamVjdG9yLnJ1bkluQ29udGV4dCgoKSA9PlxuICAgIGludGVyY2VwdG9yRm4oXG4gICAgICBpbml0aWFsUmVxdWVzdCxcbiAgICAgIGRvd25zdHJlYW1SZXF1ZXN0ID0+IGNoYWluVGFpbEZuKGRvd25zdHJlYW1SZXF1ZXN0LCBmaW5hbEhhbmRsZXJGbilcbiAgICApXG4gICk7XG4gIC8vIGNsYW5nLWZvcm1hdCBvblxufVxuXG4vKipcbiAqIEEgbXVsdGktcHJvdmlkZXIgdG9rZW4gdGhhdCByZXByZXNlbnRzIHRoZSBhcnJheSBvZiByZWdpc3RlcmVkXG4gKiBgSHR0cEludGVyY2VwdG9yYCBvYmplY3RzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEhUVFBfSU5URVJDRVBUT1JTID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48SHR0cEludGVyY2VwdG9yW10+KG5nRGV2TW9kZSA/ICdIVFRQX0lOVEVSQ0VQVE9SUycgOiAnJyk7XG5cbi8qKlxuICogQSBtdWx0aS1wcm92aWRlZCB0b2tlbiBvZiBgSHR0cEludGVyY2VwdG9yRm5gcy5cbiAqL1xuZXhwb3J0IGNvbnN0IEhUVFBfSU5URVJDRVBUT1JfRk5TID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48SHR0cEludGVyY2VwdG9yRm5bXT4obmdEZXZNb2RlID8gJ0hUVFBfSU5URVJDRVBUT1JfRk5TJyA6ICcnKTtcblxuLyoqXG4gKiBBIG11bHRpLXByb3ZpZGVkIHRva2VuIG9mIGBIdHRwSW50ZXJjZXB0b3JGbmBzIHRoYXQgYXJlIG9ubHkgc2V0IGluIHJvb3QuXG4gKi9cbmV4cG9ydCBjb25zdCBIVFRQX1JPT1RfSU5URVJDRVBUT1JfRk5TID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48SHR0cEludGVyY2VwdG9yRm5bXT4obmdEZXZNb2RlID8gJ0hUVFBfUk9PVF9JTlRFUkNFUFRPUl9GTlMnIDogJycpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYEh0dHBJbnRlcmNlcHRvckZuYCB3aGljaCBsYXppbHkgaW5pdGlhbGl6ZXMgYW4gaW50ZXJjZXB0b3IgY2hhaW4gZnJvbSB0aGUgbGVnYWN5XG4gKiBjbGFzcy1iYXNlZCBpbnRlcmNlcHRvcnMgYW5kIHJ1bnMgdGhlIHJlcXVlc3QgdGhyb3VnaCBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlZ2FjeUludGVyY2VwdG9yRm5GYWN0b3J5KCk6IEh0dHBJbnRlcmNlcHRvckZuIHtcbiAgbGV0IGNoYWluOiBDaGFpbmVkSW50ZXJjZXB0b3JGbjxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHJldHVybiAocmVxLCBoYW5kbGVyKSA9PiB7XG4gICAgaWYgKGNoYWluID09PSBudWxsKSB7XG4gICAgICBjb25zdCBpbnRlcmNlcHRvcnMgPSBpbmplY3QoSFRUUF9JTlRFUkNFUFRPUlMsIHtvcHRpb25hbDogdHJ1ZX0pID8/IFtdO1xuICAgICAgLy8gTm90ZTogaW50ZXJjZXB0b3JzIGFyZSB3cmFwcGVkIHJpZ2h0LXRvLWxlZnQgc28gdGhhdCBmaW5hbCBleGVjdXRpb24gb3JkZXIgaXNcbiAgICAgIC8vIGxlZnQtdG8tcmlnaHQuIFRoYXQgaXMsIGlmIGBpbnRlcmNlcHRvcnNgIGlzIHRoZSBhcnJheSBgW2EsIGIsIGNdYCwgd2Ugd2FudCB0b1xuICAgICAgLy8gcHJvZHVjZSBhIGNoYWluIHRoYXQgaXMgY29uY2VwdHVhbGx5IGBjKGIoYShlbmQpKSlgLCB3aGljaCB3ZSBidWlsZCBmcm9tIHRoZSBpbnNpZGVcbiAgICAgIC8vIG91dC5cbiAgICAgIGNoYWluID0gaW50ZXJjZXB0b3JzLnJlZHVjZVJpZ2h0KFxuICAgICAgICAgIGFkYXB0TGVnYWN5SW50ZXJjZXB0b3JUb0NoYWluLCBpbnRlcmNlcHRvckNoYWluRW5kRm4gYXMgQ2hhaW5lZEludGVyY2VwdG9yRm48YW55Pik7XG4gICAgfVxuXG4gICAgY29uc3QgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KEluaXRpYWxSZW5kZXJQZW5kaW5nVGFza3MpO1xuICAgIGNvbnN0IHRhc2tJZCA9IHBlbmRpbmdUYXNrcy5hZGQoKTtcbiAgICByZXR1cm4gY2hhaW4ocmVxLCBoYW5kbGVyKS5waXBlKGZpbmFsaXplKCgpID0+IHBlbmRpbmdUYXNrcy5yZW1vdmUodGFza0lkKSkpO1xuICB9O1xufVxuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgSHR0cEludGVyY2VwdG9ySGFuZGxlciBleHRlbmRzIEh0dHBIYW5kbGVyIHtcbiAgcHJpdmF0ZSBjaGFpbjogQ2hhaW5lZEludGVyY2VwdG9yRm48dW5rbm93bj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KEluaXRpYWxSZW5kZXJQZW5kaW5nVGFza3MpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYmFja2VuZDogSHR0cEJhY2tlbmQsIHByaXZhdGUgaW5qZWN0b3I6IEVudmlyb25tZW50SW5qZWN0b3IpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgaGFuZGxlKGluaXRpYWxSZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+KTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgIGlmICh0aGlzLmNoYWluID09PSBudWxsKSB7XG4gICAgICBjb25zdCBkZWR1cGVkSW50ZXJjZXB0b3JGbnMgPSBBcnJheS5mcm9tKG5ldyBTZXQoW1xuICAgICAgICAuLi50aGlzLmluamVjdG9yLmdldChIVFRQX0lOVEVSQ0VQVE9SX0ZOUyksXG4gICAgICAgIC4uLnRoaXMuaW5qZWN0b3IuZ2V0KEhUVFBfUk9PVF9JTlRFUkNFUFRPUl9GTlMsIFtdKSxcbiAgICAgIF0pKTtcblxuICAgICAgLy8gTm90ZTogaW50ZXJjZXB0b3JzIGFyZSB3cmFwcGVkIHJpZ2h0LXRvLWxlZnQgc28gdGhhdCBmaW5hbCBleGVjdXRpb24gb3JkZXIgaXNcbiAgICAgIC8vIGxlZnQtdG8tcmlnaHQuIFRoYXQgaXMsIGlmIGBkZWR1cGVkSW50ZXJjZXB0b3JGbnNgIGlzIHRoZSBhcnJheSBgW2EsIGIsIGNdYCwgd2Ugd2FudCB0b1xuICAgICAgLy8gcHJvZHVjZSBhIGNoYWluIHRoYXQgaXMgY29uY2VwdHVhbGx5IGBjKGIoYShlbmQpKSlgLCB3aGljaCB3ZSBidWlsZCBmcm9tIHRoZSBpbnNpZGVcbiAgICAgIC8vIG91dC5cbiAgICAgIHRoaXMuY2hhaW4gPSBkZWR1cGVkSW50ZXJjZXB0b3JGbnMucmVkdWNlUmlnaHQoXG4gICAgICAgICAgKG5leHRTZXF1ZW5jZWRGbiwgaW50ZXJjZXB0b3JGbikgPT5cbiAgICAgICAgICAgICAgY2hhaW5lZEludGVyY2VwdG9yRm4obmV4dFNlcXVlbmNlZEZuLCBpbnRlcmNlcHRvckZuLCB0aGlzLmluamVjdG9yKSxcbiAgICAgICAgICBpbnRlcmNlcHRvckNoYWluRW5kRm4gYXMgQ2hhaW5lZEludGVyY2VwdG9yRm48dW5rbm93bj4pO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2tJZCA9IHRoaXMucGVuZGluZ1Rhc2tzLmFkZCgpO1xuICAgIHJldHVybiB0aGlzLmNoYWluKGluaXRpYWxSZXF1ZXN0LCBkb3duc3RyZWFtUmVxdWVzdCA9PiB0aGlzLmJhY2tlbmQuaGFuZGxlKGRvd25zdHJlYW1SZXF1ZXN0KSlcbiAgICAgICAgLnBpcGUoZmluYWxpemUoKCkgPT4gdGhpcy5wZW5kaW5nVGFza3MucmVtb3ZlKHRhc2tJZCkpKTtcbiAgfVxufVxuIl19