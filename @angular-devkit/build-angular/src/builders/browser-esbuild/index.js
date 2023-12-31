"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEsbuildBrowser = void 0;
const architect_1 = require("@angular-devkit/architect");
const application_1 = require("../application");
const builder_status_warnings_1 = require("./builder-status-warnings");
/**
 * Main execution function for the esbuild-based application builder.
 * The options are compatible with the Webpack-based builder.
 * @param userOptions The browser builder options to use when setting up the application build
 * @param context The Architect builder context object
 * @returns An async iterable with the builder result output
 */
function buildEsbuildBrowser(userOptions, context, infrastructureSettings) {
    // Inform user of status of builder and options
    (0, builder_status_warnings_1.logBuilderStatusWarnings)(userOptions, context);
    const normalizedOptions = normalizeOptions(userOptions);
    return (0, application_1.buildApplicationInternal)(normalizedOptions, context, infrastructureSettings);
}
exports.buildEsbuildBrowser = buildEsbuildBrowser;
function normalizeOptions(options) {
    const { main: browser, ngswConfigPath, serviceWorker, ...otherOptions } = options;
    return {
        browser,
        serviceWorker: serviceWorker ? ngswConfigPath : false,
        ...otherOptions,
    };
}
exports.default = (0, architect_1.createBuilder)(buildEsbuildBrowser);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgseURBQXlGO0FBRXpGLGdEQUEwRDtBQUUxRCx1RUFBcUU7QUFHckU7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQ2pDLFdBQWtDLEVBQ2xDLE9BQXVCLEVBQ3ZCLHNCQUVDO0lBT0QsK0NBQStDO0lBQy9DLElBQUEsa0RBQXdCLEVBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRS9DLE1BQU0saUJBQWlCLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFeEQsT0FBTyxJQUFBLHNDQUF3QixFQUFDLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0FBQ3RGLENBQUM7QUFsQkQsa0RBa0JDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUE4QjtJQUN0RCxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBRWxGLE9BQU87UUFDTCxPQUFPO1FBQ1AsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLO1FBQ3JELEdBQUcsWUFBWTtLQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLElBQUEseUJBQWEsRUFBQyxtQkFBbUIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJ1aWxkZXJDb250ZXh0LCBCdWlsZGVyT3V0cHV0LCBjcmVhdGVCdWlsZGVyIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgdHlwZSB7IE91dHB1dEZpbGUgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB7IGJ1aWxkQXBwbGljYXRpb25JbnRlcm5hbCB9IGZyb20gJy4uL2FwcGxpY2F0aW9uJztcbmltcG9ydCB7IFNjaGVtYSBhcyBBcHBsaWNhdGlvbkJ1aWxkZXJPcHRpb25zIH0gZnJvbSAnLi4vYXBwbGljYXRpb24vc2NoZW1hJztcbmltcG9ydCB7IGxvZ0J1aWxkZXJTdGF0dXNXYXJuaW5ncyB9IGZyb20gJy4vYnVpbGRlci1zdGF0dXMtd2FybmluZ3MnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEJyb3dzZXJCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuLyoqXG4gKiBNYWluIGV4ZWN1dGlvbiBmdW5jdGlvbiBmb3IgdGhlIGVzYnVpbGQtYmFzZWQgYXBwbGljYXRpb24gYnVpbGRlci5cbiAqIFRoZSBvcHRpb25zIGFyZSBjb21wYXRpYmxlIHdpdGggdGhlIFdlYnBhY2stYmFzZWQgYnVpbGRlci5cbiAqIEBwYXJhbSB1c2VyT3B0aW9ucyBUaGUgYnJvd3NlciBidWlsZGVyIG9wdGlvbnMgdG8gdXNlIHdoZW4gc2V0dGluZyB1cCB0aGUgYXBwbGljYXRpb24gYnVpbGRcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBBcmNoaXRlY3QgYnVpbGRlciBjb250ZXh0IG9iamVjdFxuICogQHJldHVybnMgQW4gYXN5bmMgaXRlcmFibGUgd2l0aCB0aGUgYnVpbGRlciByZXN1bHQgb3V0cHV0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEVzYnVpbGRCcm93c2VyKFxuICB1c2VyT3B0aW9uczogQnJvd3NlckJ1aWxkZXJPcHRpb25zLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgaW5mcmFzdHJ1Y3R1cmVTZXR0aW5ncz86IHtcbiAgICB3cml0ZT86IGJvb2xlYW47XG4gIH0sXG4pOiBBc3luY0l0ZXJhYmxlPFxuICBCdWlsZGVyT3V0cHV0ICYge1xuICAgIG91dHB1dEZpbGVzPzogT3V0cHV0RmlsZVtdO1xuICAgIGFzc2V0RmlsZXM/OiB7IHNvdXJjZTogc3RyaW5nOyBkZXN0aW5hdGlvbjogc3RyaW5nIH1bXTtcbiAgfVxuPiB7XG4gIC8vIEluZm9ybSB1c2VyIG9mIHN0YXR1cyBvZiBidWlsZGVyIGFuZCBvcHRpb25zXG4gIGxvZ0J1aWxkZXJTdGF0dXNXYXJuaW5ncyh1c2VyT3B0aW9ucywgY29udGV4dCk7XG5cbiAgY29uc3Qgbm9ybWFsaXplZE9wdGlvbnMgPSBub3JtYWxpemVPcHRpb25zKHVzZXJPcHRpb25zKTtcblxuICByZXR1cm4gYnVpbGRBcHBsaWNhdGlvbkludGVybmFsKG5vcm1hbGl6ZWRPcHRpb25zLCBjb250ZXh0LCBpbmZyYXN0cnVjdHVyZVNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zOiBCcm93c2VyQnVpbGRlck9wdGlvbnMpOiBBcHBsaWNhdGlvbkJ1aWxkZXJPcHRpb25zIHtcbiAgY29uc3QgeyBtYWluOiBicm93c2VyLCBuZ3N3Q29uZmlnUGF0aCwgc2VydmljZVdvcmtlciwgLi4ub3RoZXJPcHRpb25zIH0gPSBvcHRpb25zO1xuXG4gIHJldHVybiB7XG4gICAgYnJvd3NlcixcbiAgICBzZXJ2aWNlV29ya2VyOiBzZXJ2aWNlV29ya2VyID8gbmdzd0NvbmZpZ1BhdGggOiBmYWxzZSxcbiAgICAuLi5vdGhlck9wdGlvbnMsXG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZUJ1aWxkZXIoYnVpbGRFc2J1aWxkQnJvd3Nlcik7XG4iXX0=