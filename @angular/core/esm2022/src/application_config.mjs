/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Merge multiple application configurations from left to right.
 *
 * @param configs Two or more configurations to be merged.
 * @returns A merged [ApplicationConfig](api/core/ApplicationConfig).
 *
 * @publicApi
 */
export function mergeApplicationConfig(...configs) {
    return configs.reduce((prev, curr) => {
        return Object.assign(prev, curr, { providers: [...prev.providers, ...curr.providers] });
    }, { providers: [] });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBOzs7Ozs7R0FNRztBQWdCSDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEdBQUcsT0FBNEI7SUFDcEUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ25DLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN4RixDQUFDLEVBQUUsRUFBQyxTQUFTLEVBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVycywgUHJvdmlkZXJ9IGZyb20gJy4vZGknO1xuXG4vKipcbiAqIFNldCBvZiBjb25maWcgb3B0aW9ucyBhdmFpbGFibGUgZHVyaW5nIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXAgb3BlcmF0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBcHBsaWNhdGlvbkNvbmZpZyB7XG4gIC8qKlxuICAgKiBMaXN0IG9mIHByb3ZpZGVycyB0aGF0IHNob3VsZCBiZSBhdmFpbGFibGUgdG8gdGhlIHJvb3QgY29tcG9uZW50IGFuZCBhbGwgaXRzIGNoaWxkcmVuLlxuICAgKi9cbiAgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlcnxFbnZpcm9ubWVudFByb3ZpZGVycz47XG59XG5cbi8qKlxuICogTWVyZ2UgbXVsdGlwbGUgYXBwbGljYXRpb24gY29uZmlndXJhdGlvbnMgZnJvbSBsZWZ0IHRvIHJpZ2h0LlxuICpcbiAqIEBwYXJhbSBjb25maWdzIFR3byBvciBtb3JlIGNvbmZpZ3VyYXRpb25zIHRvIGJlIG1lcmdlZC5cbiAqIEByZXR1cm5zIEEgbWVyZ2VkIFtBcHBsaWNhdGlvbkNvbmZpZ10oYXBpL2NvcmUvQXBwbGljYXRpb25Db25maWcpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQXBwbGljYXRpb25Db25maWcoLi4uY29uZmlnczogQXBwbGljYXRpb25Db25maWdbXSk6IEFwcGxpY2F0aW9uQ29uZmlnIHtcbiAgcmV0dXJuIGNvbmZpZ3MucmVkdWNlKChwcmV2LCBjdXJyKSA9PiB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24ocHJldiwgY3Vyciwge3Byb3ZpZGVyczogWy4uLnByZXYucHJvdmlkZXJzLCAuLi5jdXJyLnByb3ZpZGVyc119KTtcbiAgfSwge3Byb3ZpZGVyczogW119KTtcbn1cbiJdfQ==