/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OpKind } from '../enums';
/**
 * Create a `StatementOp`.
 */
export function createStatementOp(statement) {
    return {
        kind: OpKind.Statement,
        statement,
        ...NEW_OP,
    };
}
/**
 * Create a `VariableOp`.
 */
export function createVariableOp(xref, variable, initializer) {
    return {
        kind: OpKind.Variable,
        xref,
        variable,
        initializer,
        ...NEW_OP,
    };
}
/**
 * Static structure shared by all operations.
 *
 * Used as a convenience via the spread operator (`...NEW_OP`) when creating new operations, and
 * ensures the fields are always in the same order.
 */
export const NEW_OP = {
    debugListId: null,
    prev: null,
    next: null,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL2lyL3NyYy9vcHMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxVQUFVLENBQUM7QUE0QmhDOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFzQixTQUFzQjtJQUMzRSxPQUFPO1FBQ0wsSUFBSSxFQUFFLE1BQU0sQ0FBQyxTQUFTO1FBQ3RCLFNBQVM7UUFDVCxHQUFHLE1BQU07S0FDVixDQUFDO0FBQ0osQ0FBQztBQTBCRDs7R0FFRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsSUFBWSxFQUFFLFFBQTBCLEVBQUUsV0FBeUI7SUFDckUsT0FBTztRQUNMLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUTtRQUNyQixJQUFJO1FBQ0osUUFBUTtRQUNSLFdBQVc7UUFDWCxHQUFHLE1BQU07S0FDVixDQUFDO0FBQ0osQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUErQztJQUNoRSxXQUFXLEVBQUUsSUFBSTtJQUNqQixJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0NBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCB7T3BLaW5kfSBmcm9tICcuLi9lbnVtcyc7XG5pbXBvcnQge09wLCBYcmVmSWR9IGZyb20gJy4uL29wZXJhdGlvbnMnO1xuaW1wb3J0IHtTZW1hbnRpY1ZhcmlhYmxlfSBmcm9tICcuLi92YXJpYWJsZSc7XG5cbi8qKlxuICogQSBzcGVjaWFsIGBPcGAgd2hpY2ggaXMgdXNlZCBpbnRlcm5hbGx5IGluIHRoZSBgT3BMaXN0YCBsaW5rZWQgbGlzdCB0byByZXByZXNlbnQgdGhlIGhlYWQgYW5kXG4gKiB0YWlsIG5vZGVzIG9mIHRoZSBsaXN0LlxuICpcbiAqIGBMaXN0RW5kT3BgIGlzIGNyZWF0ZWQgaW50ZXJuYWxseSBpbiB0aGUgYE9wTGlzdGAgYW5kIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExpc3RFbmRPcDxPcFQgZXh0ZW5kcyBPcDxPcFQ+PiBleHRlbmRzIE9wPE9wVD4ge1xuICBraW5kOiBPcEtpbmQuTGlzdEVuZDtcbn1cblxuLyoqXG4gKiBBbiBgT3BgIHdoaWNoIGRpcmVjdGx5IHdyYXBzIGFuIG91dHB1dCBgU3RhdGVtZW50YC5cbiAqXG4gKiBPZnRlbiBgU3RhdGVtZW50T3BgcyBhcmUgdGhlIGZpbmFsIHJlc3VsdCBvZiBJUiBwcm9jZXNzaW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRlbWVudE9wPE9wVCBleHRlbmRzIE9wPE9wVD4+IGV4dGVuZHMgT3A8T3BUPiB7XG4gIGtpbmQ6IE9wS2luZC5TdGF0ZW1lbnQ7XG5cbiAgLyoqXG4gICAqIFRoZSBvdXRwdXQgc3RhdGVtZW50LlxuICAgKi9cbiAgc3RhdGVtZW50OiBvLlN0YXRlbWVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBgU3RhdGVtZW50T3BgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3RhdGVtZW50T3A8T3BUIGV4dGVuZHMgT3A8T3BUPj4oc3RhdGVtZW50OiBvLlN0YXRlbWVudCk6IFN0YXRlbWVudE9wPE9wVD4ge1xuICByZXR1cm4ge1xuICAgIGtpbmQ6IE9wS2luZC5TdGF0ZW1lbnQsXG4gICAgc3RhdGVtZW50LFxuICAgIC4uLk5FV19PUCxcbiAgfTtcbn1cblxuLyoqXG4gKiBPcGVyYXRpb24gd2hpY2ggZGVjbGFyZXMgYW5kIGluaXRpYWxpemVzIGEgYFNlbWFudGljVmFyaWFibGVgLCB0aGF0IGlzIHZhbGlkIGVpdGhlciBpbiBjcmVhdGUgb3JcbiAqIHVwZGF0ZSBJUi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBWYXJpYWJsZU9wPE9wVCBleHRlbmRzIE9wPE9wVD4+IGV4dGVuZHMgT3A8T3BUPiB7XG4gIGtpbmQ6IE9wS2luZC5WYXJpYWJsZTtcblxuICAvKipcbiAgICogYFhyZWZJZGAgd2hpY2ggaWRlbnRpZmllcyB0aGlzIHNwZWNpZmljIHZhcmlhYmxlLCBhbmQgaXMgdXNlZCB0byByZWZlcmVuY2UgdGhpcyB2YXJpYWJsZSBmcm9tXG4gICAqIG90aGVyIHBhcnRzIG9mIHRoZSBJUi5cbiAgICovXG4gIHhyZWY6IFhyZWZJZDtcblxuICAvKipcbiAgICogVGhlIGBTZW1hbnRpY1ZhcmlhYmxlYCB3aGljaCBkZXNjcmliZXMgdGhlIG1lYW5pbmcgYmVoaW5kIHRoaXMgdmFyaWFibGUuXG4gICAqL1xuICB2YXJpYWJsZTogU2VtYW50aWNWYXJpYWJsZTtcblxuICAvKipcbiAgICogRXhwcmVzc2lvbiByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoZSB2YXJpYWJsZS5cbiAgICovXG4gIGluaXRpYWxpemVyOiBvLkV4cHJlc3Npb247XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgYFZhcmlhYmxlT3BgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmFyaWFibGVPcDxPcFQgZXh0ZW5kcyBPcDxPcFQ+PihcbiAgICB4cmVmOiBYcmVmSWQsIHZhcmlhYmxlOiBTZW1hbnRpY1ZhcmlhYmxlLCBpbml0aWFsaXplcjogby5FeHByZXNzaW9uKTogVmFyaWFibGVPcDxPcFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBraW5kOiBPcEtpbmQuVmFyaWFibGUsXG4gICAgeHJlZixcbiAgICB2YXJpYWJsZSxcbiAgICBpbml0aWFsaXplcixcbiAgICAuLi5ORVdfT1AsXG4gIH07XG59XG5cbi8qKlxuICogU3RhdGljIHN0cnVjdHVyZSBzaGFyZWQgYnkgYWxsIG9wZXJhdGlvbnMuXG4gKlxuICogVXNlZCBhcyBhIGNvbnZlbmllbmNlIHZpYSB0aGUgc3ByZWFkIG9wZXJhdG9yIChgLi4uTkVXX09QYCkgd2hlbiBjcmVhdGluZyBuZXcgb3BlcmF0aW9ucywgYW5kXG4gKiBlbnN1cmVzIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyBpbiB0aGUgc2FtZSBvcmRlci5cbiAqL1xuZXhwb3J0IGNvbnN0IE5FV19PUDogUGljazxPcDxhbnk+LCAnZGVidWdMaXN0SWQnfCdwcmV2J3wnbmV4dCc+ID0ge1xuICBkZWJ1Z0xpc3RJZDogbnVsbCxcbiAgcHJldjogbnVsbCxcbiAgbmV4dDogbnVsbCxcbn07XG4iXX0=