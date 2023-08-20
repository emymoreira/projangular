"use strict";
// THIS FILE IS AUTOMATICALLY GENERATED. TO UPDATE THIS FILE YOU NEED TO CHANGE THE
// CORRESPONDING JSON SCHEMA FILE, THEN RUN devkit-admin build (or bazel build ...).
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageManager = void 0;
/**
 * The preferred package manager configuration files to use for registry settings.
 */
var PackageManager;
(function (PackageManager) {
    PackageManager["Cnpm"] = "cnpm";
    PackageManager["Npm"] = "npm";
    PackageManager["Pnpm"] = "pnpm";
    PackageManager["Yarn"] = "yarn";
})(PackageManager || (exports.PackageManager = PackageManager = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL3VwZGF0ZS9zY2hlbWF0aWMvc2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxtRkFBbUY7QUFDbkYsb0ZBQW9GOzs7QUE2Q3BGOztHQUVHO0FBQ0gsSUFBWSxjQUtYO0FBTEQsV0FBWSxjQUFjO0lBQ3RCLCtCQUFhLENBQUE7SUFDYiw2QkFBVyxDQUFBO0lBQ1gsK0JBQWEsQ0FBQTtJQUNiLCtCQUFhLENBQUE7QUFDakIsQ0FBQyxFQUxXLGNBQWMsOEJBQWQsY0FBYyxRQUt6QiIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gVEhJUyBGSUxFIElTIEFVVE9NQVRJQ0FMTFkgR0VORVJBVEVELiBUTyBVUERBVEUgVEhJUyBGSUxFIFlPVSBORUVEIFRPIENIQU5HRSBUSEVcbi8vIENPUlJFU1BPTkRJTkcgSlNPTiBTQ0hFTUEgRklMRSwgVEhFTiBSVU4gZGV2a2l0LWFkbWluIGJ1aWxkIChvciBiYXplbCBidWlsZCAuLi4pLlxuXG5leHBvcnQgaW50ZXJmYWNlIFNjaGVtYSB7XG4gICAgLyoqXG4gICAgICogV2hlbiBmYWxzZSAodGhlIGRlZmF1bHQpLCByZXBvcnRzIGFuIGVycm9yIGlmIGluc3RhbGxlZCBwYWNrYWdlcyBhcmUgaW5jb21wYXRpYmxlIHdpdGhcbiAgICAgKiB0aGUgdXBkYXRlLlxuICAgICAqL1xuICAgIGZvcmNlPzogYm9vbGVhbjtcbiAgICAvKipcbiAgICAgKiBXaGVuIHVzaW5nIGAtLW1pZ3JhdGVPbmx5YCBmb3IgYSBzaW5nbGUgcGFja2FnZSwgdGhlIHZlcnNpb24gb2YgdGhhdCBwYWNrYWdlIGZyb20gd2hpY2hcbiAgICAgKiB0byBtaWdyYXRlLlxuICAgICAqL1xuICAgIGZyb20/OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBhIG1pZ3JhdGlvbiwgYnV0IGRvIG5vdCB1cGRhdGUgdGhlIGluc3RhbGxlZCB2ZXJzaW9uLlxuICAgICAqL1xuICAgIG1pZ3JhdGVPbmx5PzogYm9vbGVhbjtcbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdG8gdGhlIGxhdGVzdCB2ZXJzaW9uLCBpbmNsdWRpbmcgYmV0YSBhbmQgUkNzLlxuICAgICAqL1xuICAgIG5leHQ/OiBib29sZWFuO1xuICAgIC8qKlxuICAgICAqIFRoZSBwcmVmZXJyZWQgcGFja2FnZSBtYW5hZ2VyIGNvbmZpZ3VyYXRpb24gZmlsZXMgdG8gdXNlIGZvciByZWdpc3RyeSBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBwYWNrYWdlTWFuYWdlcj86IFBhY2thZ2VNYW5hZ2VyO1xuICAgIC8qKlxuICAgICAqIFRoZSBwYWNrYWdlIG9yIHBhY2thZ2VzIHRvIHVwZGF0ZS5cbiAgICAgKi9cbiAgICBwYWNrYWdlcz86IHN0cmluZ1tdO1xuICAgIC8qKlxuICAgICAqIFRoZSBucG0gcmVnaXN0cnkgdG8gdXNlLlxuICAgICAqL1xuICAgIHJlZ2lzdHJ5Pzogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIFdoZW4gdXNpbmcgYC0tbWlncmF0ZU9ubHlgIGZvciBhIHNpbmdsZSBwYWNrYWdlLCB0aGUgdmVyc2lvbiBvZiB0aGF0IHBhY2thZ2UgdG8gd2hpY2ggdG9cbiAgICAgKiBtaWdyYXRlLlxuICAgICAqL1xuICAgIHRvPzogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIERpc3BsYXkgYWRkaXRpb25hbCBkZXRhaWxzIGR1cmluZyB0aGUgdXBkYXRlIHByb2Nlc3MuXG4gICAgICovXG4gICAgdmVyYm9zZT86IGJvb2xlYW47XG4gICAgW3Byb3BlcnR5OiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogVGhlIHByZWZlcnJlZCBwYWNrYWdlIG1hbmFnZXIgY29uZmlndXJhdGlvbiBmaWxlcyB0byB1c2UgZm9yIHJlZ2lzdHJ5IHNldHRpbmdzLlxuICovXG5leHBvcnQgZW51bSBQYWNrYWdlTWFuYWdlciB7XG4gICAgQ25wbSA9IFwiY25wbVwiLFxuICAgIE5wbSA9IFwibnBtXCIsXG4gICAgUG5wbSA9IFwicG5wbVwiLFxuICAgIFlhcm4gPSBcInlhcm5cIixcbn1cbiJdfQ==