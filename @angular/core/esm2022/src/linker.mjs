/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// Public API for compiler
export { Compiler, COMPILER_OPTIONS, CompilerFactory, ModuleWithComponentFactories } from './linker/compiler';
export { ComponentFactory, ComponentRef } from './linker/component_factory';
export { ComponentFactoryResolver } from './linker/component_factory_resolver';
export { DestroyRef } from './linker/destroy_ref';
export { ElementRef } from './linker/element_ref';
export { NgModuleFactory, NgModuleRef } from './linker/ng_module_factory';
export { getModuleFactory, getNgModuleById } from './linker/ng_module_factory_loader';
export { QueryList } from './linker/query_list';
export { TemplateRef } from './linker/template_ref';
export { ViewContainerRef } from './linker/view_container_ref';
export { EmbeddedViewRef, ViewRef } from './linker/view_ref';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBCQUEwQjtBQUMxQixPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBbUIsNEJBQTRCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3SCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsWUFBWSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDMUUsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDN0UsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZUFBZSxFQUFFLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNwRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2xELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzdELE9BQU8sRUFBQyxlQUFlLEVBQUUsT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gUHVibGljIEFQSSBmb3IgY29tcGlsZXJcbmV4cG9ydCB7Q29tcGlsZXIsIENPTVBJTEVSX09QVElPTlMsIENvbXBpbGVyRmFjdG9yeSwgQ29tcGlsZXJPcHRpb25zLCBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzfSBmcm9tICcuL2xpbmtlci9jb21waWxlcic7XG5leHBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuZXhwb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmV4cG9ydCB7RGVzdHJveVJlZn0gZnJvbSAnLi9saW5rZXIvZGVzdHJveV9yZWYnO1xuZXhwb3J0IHtFbGVtZW50UmVmfSBmcm9tICcuL2xpbmtlci9lbGVtZW50X3JlZic7XG5leHBvcnQge05nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVSZWZ9IGZyb20gJy4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmV4cG9ydCB7Z2V0TW9kdWxlRmFjdG9yeSwgZ2V0TmdNb2R1bGVCeUlkfSBmcm9tICcuL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeV9sb2FkZXInO1xuZXhwb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuZXhwb3J0IHtUZW1wbGF0ZVJlZn0gZnJvbSAnLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmV4cG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmV4cG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL2xpbmtlci92aWV3X3JlZic7XG4iXX0=