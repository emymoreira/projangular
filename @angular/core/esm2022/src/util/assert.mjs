/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// The functions in this file verify that the assumptions we are making
// about state in an instruction are correct before implementing any logic.
// They are meant only to be called in dev mode as sanity checks.
import { stringify } from './stringify';
export function assertNumber(actual, msg) {
    if (!(typeof actual === 'number')) {
        throwError(msg, typeof actual, 'number', '===');
    }
}
export function assertNumberInRange(actual, minInclusive, maxInclusive) {
    assertNumber(actual, 'Expected a number');
    assertLessThanOrEqual(actual, maxInclusive, 'Expected number to be less than or equal to');
    assertGreaterThanOrEqual(actual, minInclusive, 'Expected number to be greater than or equal to');
}
export function assertString(actual, msg) {
    if (!(typeof actual === 'string')) {
        throwError(msg, actual === null ? 'null' : typeof actual, 'string', '===');
    }
}
export function assertFunction(actual, msg) {
    if (!(typeof actual === 'function')) {
        throwError(msg, actual === null ? 'null' : typeof actual, 'function', '===');
    }
}
export function assertEqual(actual, expected, msg) {
    if (!(actual == expected)) {
        throwError(msg, actual, expected, '==');
    }
}
export function assertNotEqual(actual, expected, msg) {
    if (!(actual != expected)) {
        throwError(msg, actual, expected, '!=');
    }
}
export function assertSame(actual, expected, msg) {
    if (!(actual === expected)) {
        throwError(msg, actual, expected, '===');
    }
}
export function assertNotSame(actual, expected, msg) {
    if (!(actual !== expected)) {
        throwError(msg, actual, expected, '!==');
    }
}
export function assertLessThan(actual, expected, msg) {
    if (!(actual < expected)) {
        throwError(msg, actual, expected, '<');
    }
}
export function assertLessThanOrEqual(actual, expected, msg) {
    if (!(actual <= expected)) {
        throwError(msg, actual, expected, '<=');
    }
}
export function assertGreaterThan(actual, expected, msg) {
    if (!(actual > expected)) {
        throwError(msg, actual, expected, '>');
    }
}
export function assertGreaterThanOrEqual(actual, expected, msg) {
    if (!(actual >= expected)) {
        throwError(msg, actual, expected, '>=');
    }
}
export function assertNotDefined(actual, msg) {
    if (actual != null) {
        throwError(msg, actual, null, '==');
    }
}
export function assertDefined(actual, msg) {
    if (actual == null) {
        throwError(msg, actual, null, '!=');
    }
}
export function throwError(msg, actual, expected, comparison) {
    throw new Error(`ASSERTION ERROR: ${msg}` +
        (comparison == null ? '' : ` [Expected=> ${expected} ${comparison} ${actual} <=Actual]`));
}
export function assertDomNode(node) {
    if (!(node instanceof Node)) {
        throwError(`The provided value must be an instance of a DOM Node but got ${stringify(node)}`);
    }
}
export function assertIndexInRange(arr, index) {
    assertDefined(arr, 'Array must be defined.');
    const maxLen = arr.length;
    if (index < 0 || index >= maxLen) {
        throwError(`Index expected to be less than ${maxLen} but got ${index}`);
    }
}
export function assertOneOf(value, ...validValues) {
    if (validValues.indexOf(value) !== -1)
        return true;
    throwError(`Expected value to be one of ${JSON.stringify(validValues)} but was ${JSON.stringify(value)}.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsdUVBQXVFO0FBQ3ZFLDJFQUEyRTtBQUMzRSxpRUFBaUU7QUFFakUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUV0QyxNQUFNLFVBQVUsWUFBWSxDQUFDLE1BQVcsRUFBRSxHQUFXO0lBQ25ELElBQUksQ0FBQyxDQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQyxFQUFFO1FBQ2pDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pEO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsTUFBVyxFQUFFLFlBQW9CLEVBQUUsWUFBb0I7SUFDekQsWUFBWSxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQzFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsNkNBQTZDLENBQUMsQ0FBQztJQUMzRix3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLGdEQUFnRCxDQUFDLENBQUM7QUFDbkcsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVyxFQUFFLEdBQVc7SUFDbkQsSUFBSSxDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssUUFBUSxDQUFDLEVBQUU7UUFDakMsVUFBVSxDQUFDLEdBQUcsRUFBRSxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM1RTtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLE1BQVcsRUFBRSxHQUFXO0lBQ3JELElBQUks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RyxDQUFDLENBQUM7QUFDaEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBUaGUgZnVuY3Rpb25zIGluIHRoaXMgZmlsZSB2ZXJpZnkgdGhhdCB0aGUgYXNzdW1wdGlvbnMgd2UgYXJlIG1ha2luZ1xuLy8gYWJvdXQgc3RhdGUgaW4gYW4gaW5zdHJ1Y3Rpb24gYXJlIGNvcnJlY3QgYmVmb3JlIGltcGxlbWVudGluZyBhbnkgbG9naWMuXG4vLyBUaGV5IGFyZSBtZWFudCBvbmx5IHRvIGJlIGNhbGxlZCBpbiBkZXYgbW9kZSBhcyBzYW5pdHkgY2hlY2tzLlxuXG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi9zdHJpbmdpZnknO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TnVtYmVyKGFjdHVhbDogYW55LCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIG51bWJlciB7XG4gIGlmICghKHR5cGVvZiBhY3R1YWwgPT09ICdudW1iZXInKSkge1xuICAgIHRocm93RXJyb3IobXNnLCB0eXBlb2YgYWN0dWFsLCAnbnVtYmVyJywgJz09PScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROdW1iZXJJblJhbmdlKFxuICAgIGFjdHVhbDogYW55LCBtaW5JbmNsdXNpdmU6IG51bWJlciwgbWF4SW5jbHVzaXZlOiBudW1iZXIpOiBhc3NlcnRzIGFjdHVhbCBpcyBudW1iZXIge1xuICBhc3NlcnROdW1iZXIoYWN0dWFsLCAnRXhwZWN0ZWQgYSBudW1iZXInKTtcbiAgYXNzZXJ0TGVzc1RoYW5PckVxdWFsKGFjdHVhbCwgbWF4SW5jbHVzaXZlLCAnRXhwZWN0ZWQgbnVtYmVyIHRvIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0bycpO1xuICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoYWN0dWFsLCBtaW5JbmNsdXNpdmUsICdFeHBlY3RlZCBudW1iZXIgdG8gYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpbmcoYWN0dWFsOiBhbnksIG1zZzogc3RyaW5nKTogYXNzZXJ0cyBhY3R1YWwgaXMgc3RyaW5nIHtcbiAgaWYgKCEodHlwZW9mIGFjdHVhbCA9PT0gJ3N0cmluZycpKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCA9PT0gbnVsbCA/ICdudWxsJyA6IHR5cGVvZiBhY3R1YWwsICdzdHJpbmcnLCAnPT09Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEZ1bmN0aW9uKGFjdHVhbDogYW55LCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIEZ1bmN0aW9uIHtcbiAgaWYgKCEodHlwZW9mIGFjdHVhbCA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsID09PSBudWxsID8gJ251bGwnIDogdHlwZW9mIGFjdHVhbCwgJ2Z1bmN0aW9uJywgJz09PScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbDxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoIShhY3R1YWwgPT0gZXhwZWN0ZWQpKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCwgZXhwZWN0ZWQsICc9PScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbDxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoIShhY3R1YWwgIT0gZXhwZWN0ZWQpKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCwgZXhwZWN0ZWQsICchPScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTYW1lPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKTogYXNzZXJ0cyBhY3R1YWwgaXMgVCB7XG4gIGlmICghKGFjdHVhbCA9PT0gZXhwZWN0ZWQpKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCwgZXhwZWN0ZWQsICc9PT0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90U2FtZTxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoIShhY3R1YWwgIT09IGV4cGVjdGVkKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkLCAnIT09Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydExlc3NUaGFuPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKTogYXNzZXJ0cyBhY3R1YWwgaXMgVCB7XG4gIGlmICghKGFjdHVhbCA8IGV4cGVjdGVkKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkLCAnPCcpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRMZXNzVGhhbk9yRXF1YWw8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnOiBzdHJpbmcpOiBhc3NlcnRzIGFjdHVhbCBpcyBUIHtcbiAgaWYgKCEoYWN0dWFsIDw9IGV4cGVjdGVkKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkLCAnPD0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0R3JlYXRlclRoYW48VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnOiBzdHJpbmcpOiBhc3NlcnRzIGFjdHVhbCBpcyBUIHtcbiAgaWYgKCEoYWN0dWFsID4gZXhwZWN0ZWQpKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCwgZXhwZWN0ZWQsICc+Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbDxUPihcbiAgICBhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoIShhY3R1YWwgPj0gZXhwZWN0ZWQpKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCwgZXhwZWN0ZWQsICc+PScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3REZWZpbmVkPFQ+KGFjdHVhbDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKGFjdHVhbCAhPSBudWxsKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCwgbnVsbCwgJz09Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydERlZmluZWQ8VD4oYWN0dWFsOiBUfG51bGx8dW5kZWZpbmVkLCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoYWN0dWFsID09IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsLCBudWxsLCAnIT0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dFcnJvcihtc2c6IHN0cmluZyk6IG5ldmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHRocm93RXJyb3IobXNnOiBzdHJpbmcsIGFjdHVhbDogYW55LCBleHBlY3RlZDogYW55LCBjb21wYXJpc29uOiBzdHJpbmcpOiBuZXZlcjtcbmV4cG9ydCBmdW5jdGlvbiB0aHJvd0Vycm9yKG1zZzogc3RyaW5nLCBhY3R1YWw/OiBhbnksIGV4cGVjdGVkPzogYW55LCBjb21wYXJpc29uPzogc3RyaW5nKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgQVNTRVJUSU9OIEVSUk9SOiAke21zZ31gICtcbiAgICAgIChjb21wYXJpc29uID09IG51bGwgPyAnJyA6IGAgW0V4cGVjdGVkPT4gJHtleHBlY3RlZH0gJHtjb21wYXJpc29ufSAke2FjdHVhbH0gPD1BY3R1YWxdYCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RG9tTm9kZShub2RlOiBhbnkpOiBhc3NlcnRzIG5vZGUgaXMgTm9kZSB7XG4gIGlmICghKG5vZGUgaW5zdGFuY2VvZiBOb2RlKSkge1xuICAgIHRocm93RXJyb3IoYFRoZSBwcm92aWRlZCB2YWx1ZSBtdXN0IGJlIGFuIGluc3RhbmNlIG9mIGEgRE9NIE5vZGUgYnV0IGdvdCAke3N0cmluZ2lmeShub2RlKX1gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SW5kZXhJblJhbmdlKGFycjogYW55W10sIGluZGV4OiBudW1iZXIpIHtcbiAgYXNzZXJ0RGVmaW5lZChhcnIsICdBcnJheSBtdXN0IGJlIGRlZmluZWQuJyk7XG4gIGNvbnN0IG1heExlbiA9IGFyci5sZW5ndGg7XG4gIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gbWF4TGVuKSB7XG4gICAgdGhyb3dFcnJvcihgSW5kZXggZXhwZWN0ZWQgdG8gYmUgbGVzcyB0aGFuICR7bWF4TGVufSBidXQgZ290ICR7aW5kZXh9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE9uZU9mKHZhbHVlOiBhbnksIC4uLnZhbGlkVmFsdWVzOiBhbnlbXSkge1xuICBpZiAodmFsaWRWYWx1ZXMuaW5kZXhPZih2YWx1ZSkgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbiAgdGhyb3dFcnJvcihgRXhwZWN0ZWQgdmFsdWUgdG8gYmUgb25lIG9mICR7SlNPTi5zdHJpbmdpZnkodmFsaWRWYWx1ZXMpfSBidXQgd2FzICR7XG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWx1ZSl9LmApO1xufVxuIl19