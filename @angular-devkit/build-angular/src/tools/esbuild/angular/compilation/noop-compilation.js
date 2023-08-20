"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopCompilation = void 0;
const angular_compilation_1 = require("./angular-compilation");
class NoopCompilation extends angular_compilation_1.AngularCompilation {
    async initialize(tsconfig, hostOptions, compilerOptionsTransformer) {
        // Load the compiler configuration and transform as needed
        const { options: originalCompilerOptions } = await this.loadConfiguration(tsconfig);
        const compilerOptions = compilerOptionsTransformer?.(originalCompilerOptions) ?? originalCompilerOptions;
        return { affectedFiles: new Set(), compilerOptions, referencedFiles: [] };
    }
    collectDiagnostics() {
        throw new Error('Not available when using noop compilation.');
    }
    emitAffectedFiles() {
        throw new Error('Not available when using noop compilation.');
    }
}
exports.NoopCompilation = NoopCompilation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9vcC1jb21waWxhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvYW5ndWxhci9jb21waWxhdGlvbi9ub29wLWNvbXBpbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUtILCtEQUEyRDtBQUUzRCxNQUFhLGVBQWdCLFNBQVEsd0NBQWtCO0lBQ3JELEtBQUssQ0FBQyxVQUFVLENBQ2QsUUFBZ0IsRUFDaEIsV0FBK0IsRUFDL0IsMEJBQXdGO1FBTXhGLDBEQUEwRDtRQUMxRCxNQUFNLEVBQUUsT0FBTyxFQUFFLHVCQUF1QixFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEYsTUFBTSxlQUFlLEdBQ25CLDBCQUEwQixFQUFFLENBQUMsdUJBQXVCLENBQUMsSUFBSSx1QkFBdUIsQ0FBQztRQUVuRixPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUM1RSxDQUFDO0lBRUQsa0JBQWtCO1FBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQsaUJBQWlCO1FBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7Q0FDRjtBQXpCRCwwQ0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgbmcgZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IEFuZ3VsYXJIb3N0T3B0aW9ucyB9IGZyb20gJy4uL2FuZ3VsYXItaG9zdCc7XG5pbXBvcnQgeyBBbmd1bGFyQ29tcGlsYXRpb24gfSBmcm9tICcuL2FuZ3VsYXItY29tcGlsYXRpb24nO1xuXG5leHBvcnQgY2xhc3MgTm9vcENvbXBpbGF0aW9uIGV4dGVuZHMgQW5ndWxhckNvbXBpbGF0aW9uIHtcbiAgYXN5bmMgaW5pdGlhbGl6ZShcbiAgICB0c2NvbmZpZzogc3RyaW5nLFxuICAgIGhvc3RPcHRpb25zOiBBbmd1bGFySG9zdE9wdGlvbnMsXG4gICAgY29tcGlsZXJPcHRpb25zVHJhbnNmb3JtZXI/OiAoY29tcGlsZXJPcHRpb25zOiBuZy5Db21waWxlck9wdGlvbnMpID0+IG5nLkNvbXBpbGVyT3B0aW9ucyxcbiAgKTogUHJvbWlzZTx7XG4gICAgYWZmZWN0ZWRGaWxlczogUmVhZG9ubHlTZXQ8dHMuU291cmNlRmlsZT47XG4gICAgY29tcGlsZXJPcHRpb25zOiBuZy5Db21waWxlck9wdGlvbnM7XG4gICAgcmVmZXJlbmNlZEZpbGVzOiByZWFkb25seSBzdHJpbmdbXTtcbiAgfT4ge1xuICAgIC8vIExvYWQgdGhlIGNvbXBpbGVyIGNvbmZpZ3VyYXRpb24gYW5kIHRyYW5zZm9ybSBhcyBuZWVkZWRcbiAgICBjb25zdCB7IG9wdGlvbnM6IG9yaWdpbmFsQ29tcGlsZXJPcHRpb25zIH0gPSBhd2FpdCB0aGlzLmxvYWRDb25maWd1cmF0aW9uKHRzY29uZmlnKTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPVxuICAgICAgY29tcGlsZXJPcHRpb25zVHJhbnNmb3JtZXI/LihvcmlnaW5hbENvbXBpbGVyT3B0aW9ucykgPz8gb3JpZ2luYWxDb21waWxlck9wdGlvbnM7XG5cbiAgICByZXR1cm4geyBhZmZlY3RlZEZpbGVzOiBuZXcgU2V0KCksIGNvbXBpbGVyT3B0aW9ucywgcmVmZXJlbmNlZEZpbGVzOiBbXSB9O1xuICB9XG5cbiAgY29sbGVjdERpYWdub3N0aWNzKCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhdmFpbGFibGUgd2hlbiB1c2luZyBub29wIGNvbXBpbGF0aW9uLicpO1xuICB9XG5cbiAgZW1pdEFmZmVjdGVkRmlsZXMoKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGF2YWlsYWJsZSB3aGVuIHVzaW5nIG5vb3AgY29tcGlsYXRpb24uJyk7XG4gIH1cbn1cbiJdfQ==