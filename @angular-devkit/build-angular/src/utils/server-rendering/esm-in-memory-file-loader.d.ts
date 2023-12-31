/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function resolve(specifier: string, context: {}, nextResolve: Function): any;
export declare function load(url: string, context: {
    format?: string | null;
}, nextLoad: Function): any;
