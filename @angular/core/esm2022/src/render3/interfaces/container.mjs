/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DESCENDANT_VIEWS_TO_REFRESH, HOST, NEXT, PARENT, T_HOST } from './view';
/**
 * Special location which allows easy identification of type. If we have an array which was
 * retrieved from the `LView` and that array has `true` at `TYPE` location, we know it is
 * `LContainer`.
 */
export const TYPE = 1;
/**
 * Below are constants for LContainer indices to help us look up LContainer members
 * without having to remember the specific indices.
 * Uglify will inline these when minifying so there shouldn't be a cost.
 */
/**
 * Flag to signify that this `LContainer` may have transplanted views which need to be change
 * detected. (see: `LView[DECLARATION_COMPONENT_VIEW])`.
 *
 * This flag, once set, is never unset for the `LContainer`. This means that when unset we can skip
 * a lot of work in `refreshEmbeddedViews`. But when set we still need to verify
 * that the `MOVED_VIEWS` are transplanted and on-push.
 */
export const HAS_TRANSPLANTED_VIEWS = 2;
// PARENT, NEXT, DESCENDANT_VIEWS_TO_REFRESH are indices 3, 4, and 5
// As we already have these constants in LView, we don't need to re-create them.
// T_HOST is index 6
// We already have this constants in LView, we don't need to re-create it.
export const NATIVE = 7;
export const VIEW_REFS = 8;
export const MOVED_VIEWS = 9;
export const DEHYDRATED_VIEWS = 10;
/**
 * Size of LContainer's header. Represents the index after which all views in the
 * container will be inserted. We need to keep a record of current views so we know
 * which views are already in the DOM (and don't need to be re-added) and so we can
 * remove views from the DOM when they are no longer required.
 */
export const CONTAINER_HEADER_OFFSET = 11;
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFNSCxPQUFPLEVBQUMsMkJBQTJCLEVBQUUsSUFBSSxFQUFTLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBSXRGOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBRXRCOzs7O0dBSUc7QUFFSDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO0FBRXhDLG9FQUFvRTtBQUNwRSxnRkFBZ0Y7QUFFaEYsb0JBQW9CO0FBQ3BCLDBFQUEwRTtBQUUxRSxNQUFNLENBQUMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDM0IsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7QUFHbkM7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQUMsTUFBTSx1QkFBdUIsR0FBRyxFQUFFLENBQUM7QUEyRjFDLGlGQUFpRjtBQUNqRiwwQkFBMEI7QUFDMUIsTUFBTSxDQUFDLE1BQU0sNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGVoeWRyYXRlZENvbnRhaW5lclZpZXd9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi9pbnRlcmZhY2VzJztcblxuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50fSBmcm9tICcuL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0RFU0NFTkRBTlRfVklFV1NfVE9fUkVGUkVTSCwgSE9TVCwgTFZpZXcsIE5FWFQsIFBBUkVOVCwgVF9IT1NUfSBmcm9tICcuL3ZpZXcnO1xuXG5cblxuLyoqXG4gKiBTcGVjaWFsIGxvY2F0aW9uIHdoaWNoIGFsbG93cyBlYXN5IGlkZW50aWZpY2F0aW9uIG9mIHR5cGUuIElmIHdlIGhhdmUgYW4gYXJyYXkgd2hpY2ggd2FzXG4gKiByZXRyaWV2ZWQgZnJvbSB0aGUgYExWaWV3YCBhbmQgdGhhdCBhcnJheSBoYXMgYHRydWVgIGF0IGBUWVBFYCBsb2NhdGlvbiwgd2Uga25vdyBpdCBpc1xuICogYExDb250YWluZXJgLlxuICovXG5leHBvcnQgY29uc3QgVFlQRSA9IDE7XG5cbi8qKlxuICogQmVsb3cgYXJlIGNvbnN0YW50cyBmb3IgTENvbnRhaW5lciBpbmRpY2VzIHRvIGhlbHAgdXMgbG9vayB1cCBMQ29udGFpbmVyIG1lbWJlcnNcbiAqIHdpdGhvdXQgaGF2aW5nIHRvIHJlbWVtYmVyIHRoZSBzcGVjaWZpYyBpbmRpY2VzLlxuICogVWdsaWZ5IHdpbGwgaW5saW5lIHRoZXNlIHdoZW4gbWluaWZ5aW5nIHNvIHRoZXJlIHNob3VsZG4ndCBiZSBhIGNvc3QuXG4gKi9cblxuLyoqXG4gKiBGbGFnIHRvIHNpZ25pZnkgdGhhdCB0aGlzIGBMQ29udGFpbmVyYCBtYXkgaGF2ZSB0cmFuc3BsYW50ZWQgdmlld3Mgd2hpY2ggbmVlZCB0byBiZSBjaGFuZ2VcbiAqIGRldGVjdGVkLiAoc2VlOiBgTFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddKWAuXG4gKlxuICogVGhpcyBmbGFnLCBvbmNlIHNldCwgaXMgbmV2ZXIgdW5zZXQgZm9yIHRoZSBgTENvbnRhaW5lcmAuIFRoaXMgbWVhbnMgdGhhdCB3aGVuIHVuc2V0IHdlIGNhbiBza2lwXG4gKiBhIGxvdCBvZiB3b3JrIGluIGByZWZyZXNoRW1iZWRkZWRWaWV3c2AuIEJ1dCB3aGVuIHNldCB3ZSBzdGlsbCBuZWVkIHRvIHZlcmlmeVxuICogdGhhdCB0aGUgYE1PVkVEX1ZJRVdTYCBhcmUgdHJhbnNwbGFudGVkIGFuZCBvbi1wdXNoLlxuICovXG5leHBvcnQgY29uc3QgSEFTX1RSQU5TUExBTlRFRF9WSUVXUyA9IDI7XG5cbi8vIFBBUkVOVCwgTkVYVCwgREVTQ0VOREFOVF9WSUVXU19UT19SRUZSRVNIIGFyZSBpbmRpY2VzIDMsIDQsIGFuZCA1XG4vLyBBcyB3ZSBhbHJlYWR5IGhhdmUgdGhlc2UgY29uc3RhbnRzIGluIExWaWV3LCB3ZSBkb24ndCBuZWVkIHRvIHJlLWNyZWF0ZSB0aGVtLlxuXG4vLyBUX0hPU1QgaXMgaW5kZXggNlxuLy8gV2UgYWxyZWFkeSBoYXZlIHRoaXMgY29uc3RhbnRzIGluIExWaWV3LCB3ZSBkb24ndCBuZWVkIHRvIHJlLWNyZWF0ZSBpdC5cblxuZXhwb3J0IGNvbnN0IE5BVElWRSA9IDc7XG5leHBvcnQgY29uc3QgVklFV19SRUZTID0gODtcbmV4cG9ydCBjb25zdCBNT1ZFRF9WSUVXUyA9IDk7XG5leHBvcnQgY29uc3QgREVIWURSQVRFRF9WSUVXUyA9IDEwO1xuXG5cbi8qKlxuICogU2l6ZSBvZiBMQ29udGFpbmVyJ3MgaGVhZGVyLiBSZXByZXNlbnRzIHRoZSBpbmRleCBhZnRlciB3aGljaCBhbGwgdmlld3MgaW4gdGhlXG4gKiBjb250YWluZXIgd2lsbCBiZSBpbnNlcnRlZC4gV2UgbmVlZCB0byBrZWVwIGEgcmVjb3JkIG9mIGN1cnJlbnQgdmlld3Mgc28gd2Uga25vd1xuICogd2hpY2ggdmlld3MgYXJlIGFscmVhZHkgaW4gdGhlIERPTSAoYW5kIGRvbid0IG5lZWQgdG8gYmUgcmUtYWRkZWQpIGFuZCBzbyB3ZSBjYW5cbiAqIHJlbW92ZSB2aWV3cyBmcm9tIHRoZSBET00gd2hlbiB0aGV5IGFyZSBubyBsb25nZXIgcmVxdWlyZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBDT05UQUlORVJfSEVBREVSX09GRlNFVCA9IDExO1xuXG4vKipcbiAqIFRoZSBzdGF0ZSBhc3NvY2lhdGVkIHdpdGggYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBpcyBhbiBhcnJheSBzbyB0aGF0IGl0cyBzdHJ1Y3R1cmUgaXMgY2xvc2VyIHRvIExWaWV3LiBUaGlzIGhlbHBzXG4gKiB3aGVuIHRyYXZlcnNpbmcgdGhlIHZpZXcgdHJlZSAod2hpY2ggaXMgYSBtaXggb2YgY29udGFpbmVycyBhbmQgY29tcG9uZW50XG4gKiB2aWV3cyksIHNvIHdlIGNhbiBqdW1wIHRvIHZpZXdPckNvbnRhaW5lcltORVhUXSBpbiB0aGUgc2FtZSB3YXkgcmVnYXJkbGVzc1xuICogb2YgdHlwZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMQ29udGFpbmVyIGV4dGVuZHMgQXJyYXk8YW55PiB7XG4gIC8qKlxuICAgKiBUaGUgaG9zdCBlbGVtZW50IG9mIHRoaXMgTENvbnRhaW5lci5cbiAgICpcbiAgICogVGhlIGhvc3QgY291bGQgYmUgYW4gTFZpZXcgaWYgdGhpcyBjb250YWluZXIgaXMgb24gYSBjb21wb25lbnQgbm9kZS5cbiAgICogSW4gdGhhdCBjYXNlLCB0aGUgY29tcG9uZW50IExWaWV3IGlzIGl0cyBIT1NULlxuICAgKi9cbiAgcmVhZG9ubHlbSE9TVF06IFJFbGVtZW50fFJDb21tZW50fExWaWV3O1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIGEgdHlwZSBmaWVsZCB3aGljaCBhbGxvd3MgdXMgdG8gZGlmZmVyZW50aWF0ZSBgTENvbnRhaW5lcmAgZnJvbSBgU3R5bGluZ0NvbnRleHRgIGluIGFuXG4gICAqIGVmZmljaWVudCB3YXkuIFRoZSB2YWx1ZSBpcyBhbHdheXMgc2V0IHRvIGB0cnVlYFxuICAgKi9cbiAgW1RZUEVdOiB0cnVlO1xuXG4gIC8qKlxuICAgKiBGbGFnIHRvIHNpZ25pZnkgdGhhdCB0aGlzIGBMQ29udGFpbmVyYCBtYXkgaGF2ZSB0cmFuc3BsYW50ZWQgdmlld3Mgd2hpY2ggbmVlZCB0byBiZSBjaGFuZ2VcbiAgICogZGV0ZWN0ZWQuIChzZWU6IGBMVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10pYC5cbiAgICpcbiAgICogVGhpcyBmbGFnLCBvbmNlIHNldCwgaXMgbmV2ZXIgdW5zZXQgZm9yIHRoZSBgTENvbnRhaW5lcmAuXG4gICAqL1xuICBbSEFTX1RSQU5TUExBTlRFRF9WSUVXU106IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEFjY2VzcyB0byB0aGUgcGFyZW50IHZpZXcgaXMgbmVjZXNzYXJ5IHNvIHdlIGNhbiBwcm9wYWdhdGUgYmFja1xuICAgKiB1cCBmcm9tIGluc2lkZSBhIGNvbnRhaW5lciB0byBwYXJlbnRbTkVYVF0uXG4gICAqL1xuICBbUEFSRU5UXTogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFRoaXMgYWxsb3dzIHVzIHRvIGp1bXAgZnJvbSBhIGNvbnRhaW5lciB0byBhIHNpYmxpbmcgY29udGFpbmVyIG9yIGNvbXBvbmVudFxuICAgKiB2aWV3IHdpdGggdGhlIHNhbWUgcGFyZW50LCBzbyB3ZSBjYW4gcmVtb3ZlIGxpc3RlbmVycyBlZmZpY2llbnRseS5cbiAgICovXG4gIFtORVhUXTogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIGRpcmVjdCB0cmFuc3BsYW50ZWQgdmlld3Mgd2hpY2ggbmVlZCBhIHJlZnJlc2ggb3IgaGF2ZSBkZXNjZW5kYW50cyB0aGVtc2VsdmVzXG4gICAqIHRoYXQgbmVlZCBhIHJlZnJlc2ggYnV0IGhhdmUgbm90IG1hcmtlZCB0aGVpciBhbmNlc3RvcnMgYXMgRGlydHkuIFRoaXMgdGVsbHMgdXMgdGhhdCBkdXJpbmdcbiAgICogY2hhbmdlIGRldGVjdGlvbiB3ZSBzaG91bGQgc3RpbGwgZGVzY2VuZCB0byBmaW5kIHRob3NlIGNoaWxkcmVuIHRvIHJlZnJlc2gsIGV2ZW4gaWYgdGhlIHBhcmVudHNcbiAgICogYXJlIG5vdCBgRGlydHlgL2BDaGVja0Fsd2F5c2AuXG4gICAqL1xuICBbREVTQ0VOREFOVF9WSUVXU19UT19SRUZSRVNIXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIGNvbGxlY3Rpb24gb2Ygdmlld3MgY3JlYXRlZCBiYXNlZCBvbiB0aGUgdW5kZXJseWluZyBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCBidXQgaW5zZXJ0ZWQgaW50b1xuICAgKiBhIGRpZmZlcmVudCBgTENvbnRhaW5lcmAuIFdlIG5lZWQgdG8gdHJhY2sgdmlld3MgY3JlYXRlZCBmcm9tIGEgZ2l2ZW4gZGVjbGFyYXRpb24gcG9pbnQgc2luY2VcbiAgICogcXVlcmllcyBjb2xsZWN0IG1hdGNoZXMgZnJvbSB0aGUgZW1iZWRkZWQgdmlldyBkZWNsYXJhdGlvbiBwb2ludCBhbmQgX25vdF8gdGhlIGluc2VydGlvbiBwb2ludC5cbiAgICovXG4gIFtNT1ZFRF9WSUVXU106IExWaWV3W118bnVsbDtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgYFROb2RlYCB3aGljaCByZXByZXNlbnRzIHRoZSBob3N0IG9mIHRoZSBjb250YWluZXIuXG4gICAqL1xuICBbVF9IT1NUXTogVE5vZGU7XG5cbiAgLyoqIFRoZSBjb21tZW50IGVsZW1lbnQgdGhhdCBzZXJ2ZXMgYXMgYW4gYW5jaG9yIGZvciB0aGlzIExDb250YWluZXIuICovXG4gIFtOQVRJVkVdOiBSQ29tbWVudDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgYFZpZXdSZWZgcyB1c2VkIGJ5IGFueSBgVmlld0NvbnRhaW5lclJlZmBzIHRoYXQgcG9pbnQgdG8gdGhpcyBjb250YWluZXIuXG4gICAqXG4gICAqIFRoaXMgaXMgbGF6aWx5IGluaXRpYWxpemVkIGJ5IGBWaWV3Q29udGFpbmVyUmVmYCB3aGVuIHRoZSBmaXJzdCB2aWV3IGlzIGluc2VydGVkLlxuICAgKlxuICAgKiBOT1RFOiBUaGlzIGlzIHN0b3JlZCBhcyBgYW55W11gIGJlY2F1c2UgcmVuZGVyMyBzaG91bGQgcmVhbGx5IG5vdCBiZSBhd2FyZSBvZiBgVmlld1JlZmAgYW5kXG4gICAqIGRvaW5nIHNvIGNyZWF0ZXMgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICovXG4gIFtWSUVXX1JFRlNdOiB1bmtub3duW118bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgZGVoeWRyYXRlZCB2aWV3cyB3aXRoaW4gdGhpcyBjb250YWluZXIuXG4gICAqXG4gICAqIFRoaXMgaW5mb3JtYXRpb24gaXMgdXNlZCBkdXJpbmcgdGhlIGh5ZHJhdGlvbiBwcm9jZXNzIG9uIHRoZSBjbGllbnQuXG4gICAqIFRoZSBoeWRyYXRpb24gbG9naWMgdHJpZXMgdG8gZmluZCBhIG1hdGNoaW5nIGRlaHlkcmF0ZWQgdmlldywgXCJjbGFpbVwiIGl0XG4gICAqIGFuZCB1c2UgdGhpcyBpbmZvcm1hdGlvbiB0byBkbyBmdXJ0aGVyIG1hdGNoaW5nLiBBZnRlciB0aGF0LCB0aGlzIFwiY2xhaW1lZFwiXG4gICAqIHZpZXcgaXMgcmVtb3ZlZCBmcm9tIHRoZSBsaXN0LiBUaGUgcmVtYWluaW5nIFwidW5jbGFpbWVkXCIgdmlld3MgYXJlXG4gICAqIFwiZ2FyYmFnZS1jb2xsZWN0ZWRcIiBsYXRlciBvbiwgaS5lLiByZW1vdmVkIGZyb20gdGhlIERPTSBvbmNlIHRoZSBoeWRyYXRpb25cbiAgICogbG9naWMgZmluaXNoZXMuXG4gICAqL1xuICBbREVIWURSQVRFRF9WSUVXU106IERlaHlkcmF0ZWRDb250YWluZXJWaWV3W118bnVsbDtcbn1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==