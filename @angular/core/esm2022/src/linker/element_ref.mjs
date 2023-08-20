/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCurrentTNode, getLView } from '../render3/state';
import { getNativeByTNode } from '../render3/util/view_utils';
/**
 * Creates an ElementRef from the most recent node.
 *
 * @returns The ElementRef instance to use
 */
export function injectElementRef() {
    return createElementRef(getCurrentTNode(), getLView());
}
/**
 * Creates an ElementRef given a node.
 *
 * @param tNode The node for which you'd like an ElementRef
 * @param lView The view to which the node belongs
 * @returns The ElementRef instance to use
 */
export function createElementRef(tNode, lView) {
    return new ElementRef(getNativeByTNode(tNode, lView));
}
/**
 * A wrapper around a native element inside of a View.
 *
 * An `ElementRef` is backed by a render-specific element. In the browser, this is usually a DOM
 * element.
 *
 * @security Permitting direct access to the DOM can make your application more vulnerable to
 * XSS attacks. Carefully review any use of `ElementRef` in your code. For more detail, see the
 * [Security Guide](https://g.co/ng/security).
 *
 * @publicApi
 */
// Note: We don't expose things like `Injector`, `ViewContainer`, ... here,
// i.e. users have to ask for what they need. With that, we can build better analysis tools
// and could do better codegen in the future.
export class ElementRef {
    constructor(nativeElement) {
        this.nativeElement = nativeElement;
    }
    /**
     * @internal
     * @nocollapse
     */
    static { this.__NG_ELEMENT_ID__ = injectElementRef; }
}
/**
 * Unwraps `ElementRef` and return the `nativeElement`.
 *
 * @param value value to unwrap
 * @returns `nativeElement` if `ElementRef` otherwise returns value as is.
 */
export function unwrapElementRef(value) {
    return value instanceof ElementRef ? value.nativeElement : value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvZWxlbWVudF9yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0gsT0FBTyxFQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUU1RDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQjtJQUM5QixPQUFPLGdCQUFnQixDQUFDLGVBQWUsRUFBRyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUN6RCxPQUFPLElBQUksVUFBVSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWEsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILDJFQUEyRTtBQUMzRSwyRkFBMkY7QUFDM0YsNkNBQTZDO0FBQzdDLE1BQU0sT0FBTyxVQUFVO0lBYXJCLFlBQVksYUFBZ0I7UUFDMUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7T0FHRzthQUNJLHNCQUFpQixHQUFxQixnQkFBZ0IsQ0FBQzs7QUFHaEU7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQU8sS0FBc0I7SUFDM0QsT0FBTyxLQUFLLFlBQVksVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDbkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFROb2RlLCBnZXRMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9zdGF0ZSc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgZnJvbSB0aGUgbW9zdCByZWNlbnQgbm9kZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEVsZW1lbnRSZWYoKTogRWxlbWVudFJlZiB7XG4gIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKGdldEN1cnJlbnRUTm9kZSgpISwgZ2V0TFZpZXcoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIHlvdSdkIGxpa2UgYW4gRWxlbWVudFJlZlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudFJlZih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IEVsZW1lbnRSZWYge1xuICByZXR1cm4gbmV3IEVsZW1lbnRSZWYoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50KTtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGEgbmF0aXZlIGVsZW1lbnQgaW5zaWRlIG9mIGEgVmlldy5cbiAqXG4gKiBBbiBgRWxlbWVudFJlZmAgaXMgYmFja2VkIGJ5IGEgcmVuZGVyLXNwZWNpZmljIGVsZW1lbnQuIEluIHRoZSBicm93c2VyLCB0aGlzIGlzIHVzdWFsbHkgYSBET01cbiAqIGVsZW1lbnQuXG4gKlxuICogQHNlY3VyaXR5IFBlcm1pdHRpbmcgZGlyZWN0IGFjY2VzcyB0byB0aGUgRE9NIGNhbiBtYWtlIHlvdXIgYXBwbGljYXRpb24gbW9yZSB2dWxuZXJhYmxlIHRvXG4gKiBYU1MgYXR0YWNrcy4gQ2FyZWZ1bGx5IHJldmlldyBhbnkgdXNlIG9mIGBFbGVtZW50UmVmYCBpbiB5b3VyIGNvZGUuIEZvciBtb3JlIGRldGFpbCwgc2VlIHRoZVxuICogW1NlY3VyaXR5IEd1aWRlXShodHRwczovL2cuY28vbmcvc2VjdXJpdHkpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuLy8gTm90ZTogV2UgZG9uJ3QgZXhwb3NlIHRoaW5ncyBsaWtlIGBJbmplY3RvcmAsIGBWaWV3Q29udGFpbmVyYCwgLi4uIGhlcmUsXG4vLyBpLmUuIHVzZXJzIGhhdmUgdG8gYXNrIGZvciB3aGF0IHRoZXkgbmVlZC4gV2l0aCB0aGF0LCB3ZSBjYW4gYnVpbGQgYmV0dGVyIGFuYWx5c2lzIHRvb2xzXG4vLyBhbmQgY291bGQgZG8gYmV0dGVyIGNvZGVnZW4gaW4gdGhlIGZ1dHVyZS5cbmV4cG9ydCBjbGFzcyBFbGVtZW50UmVmPFQgPSBhbnk+IHtcbiAgLyoqXG4gICAqIDxkaXYgY2xhc3M9XCJjYWxsb3V0IGlzLWNyaXRpY2FsXCI+XG4gICAqICAgPGhlYWRlcj5Vc2Ugd2l0aCBjYXV0aW9uPC9oZWFkZXI+XG4gICAqICAgPHA+XG4gICAqICAgIFVzZSB0aGlzIEFQSSBhcyB0aGUgbGFzdCByZXNvcnQgd2hlbiBkaXJlY3QgYWNjZXNzIHRvIERPTSBpcyBuZWVkZWQuIFVzZSB0ZW1wbGF0aW5nIGFuZFxuICAgKiAgICBkYXRhLWJpbmRpbmcgcHJvdmlkZWQgYnkgQW5ndWxhciBpbnN0ZWFkLiBBbHRlcm5hdGl2ZWx5IHlvdSBjYW4gdGFrZSBhIGxvb2sgYXQge0BsaW5rXG4gICAqIFJlbmRlcmVyMn0gd2hpY2ggcHJvdmlkZXMgYW4gQVBJIHRoYXQgY2FuIGJlIHNhZmVseSB1c2VkLlxuICAgKiAgIDwvcD5cbiAgICogPC9kaXY+XG4gICAqL1xuICBwdWJsaWMgbmF0aXZlRWxlbWVudDogVDtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVFbGVtZW50OiBUKSB7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlRWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQG5vY29sbGFwc2VcbiAgICovXG4gIHN0YXRpYyBfX05HX0VMRU1FTlRfSURfXzogKCkgPT4gRWxlbWVudFJlZiA9IGluamVjdEVsZW1lbnRSZWY7XG59XG5cbi8qKlxuICogVW53cmFwcyBgRWxlbWVudFJlZmAgYW5kIHJldHVybiB0aGUgYG5hdGl2ZUVsZW1lbnRgLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSB0byB1bndyYXBcbiAqIEByZXR1cm5zIGBuYXRpdmVFbGVtZW50YCBpZiBgRWxlbWVudFJlZmAgb3RoZXJ3aXNlIHJldHVybnMgdmFsdWUgYXMgaXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBFbGVtZW50UmVmPFQsIFI+KHZhbHVlOiBUfEVsZW1lbnRSZWY8Uj4pOiBUfFIge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50UmVmID8gdmFsdWUubmF0aXZlRWxlbWVudCA6IHZhbHVlO1xufVxuIl19