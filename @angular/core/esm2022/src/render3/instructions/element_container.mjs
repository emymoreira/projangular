/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { validateMatchingNode, validateNodeExists } from '../../hydration/error_handling';
import { locateNextRNode, siblingAfter } from '../../hydration/node_lookup_utils';
import { getNgContainerSize, markRNodeAsClaimedByHydration, setSegmentHead } from '../../hydration/utils';
import { assertEqual, assertIndexInRange, assertNumber } from '../../util/assert';
import { assertHasParent } from '../assert';
import { attachPatchData } from '../context_discovery';
import { registerPostOrderHooks } from '../hooks';
import { isContentQueryHost, isDirectiveHost } from '../interfaces/type_checks';
import { HEADER_OFFSET, HYDRATION, RENDERER } from '../interfaces/view';
import { assertTNodeType } from '../node_assert';
import { appendChild, createCommentNode } from '../node_manipulation';
import { getBindingIndex, getCurrentTNode, getLView, getTView, isCurrentTNodeParent, isInSkipHydrationBlock, lastNodeWasCreated, setCurrentTNode, setCurrentTNodeAsNotParent, wasLastNodeCreated } from '../state';
import { computeStaticStyling } from '../styling/static_styling';
import { getConstant } from '../util/view_utils';
import { createDirectivesInstances, executeContentQueries, getOrCreateTNode, resolveDirectives, saveResolvedLocalsInData } from './shared';
function elementContainerStartFirstCreatePass(index, tView, lView, attrsIndex, localRefsIndex) {
    ngDevMode && ngDevMode.firstCreatePass++;
    const tViewConsts = tView.consts;
    const attrs = getConstant(tViewConsts, attrsIndex);
    const tNode = getOrCreateTNode(tView, index, 8 /* TNodeType.ElementContainer */, 'ng-container', attrs);
    // While ng-container doesn't necessarily support styling, we use the style context to identify
    // and execute directives on the ng-container.
    if (attrs !== null) {
        computeStaticStyling(tNode, attrs, true);
    }
    const localRefs = getConstant(tViewConsts, localRefsIndex);
    resolveDirectives(tView, lView, tNode, localRefs);
    if (tView.queries !== null) {
        tView.queries.elementStart(tView, tNode);
    }
    return tNode;
}
/**
 * Creates a logical container for other nodes (<ng-container>) backed by a comment node in the DOM.
 * The instruction must later be followed by `elementContainerEnd()` call.
 *
 * @param index Index of the element in the LView array
 * @param attrsIndex Index of the container attributes in the `consts` array.
 * @param localRefsIndex Index of the container's local references in the `consts` array.
 * @returns This function returns itself so that it may be chained.
 *
 * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
 * the DOM (as a comment node can't have attributes). Attributes are here only for directive
 * matching purposes and setting initial inputs of directives.
 *
 * @codeGenApi
 */
export function ɵɵelementContainerStart(index, attrsIndex, localRefsIndex) {
    const lView = getLView();
    const tView = getTView();
    const adjustedIndex = index + HEADER_OFFSET;
    ngDevMode && assertIndexInRange(lView, adjustedIndex);
    ngDevMode &&
        assertEqual(getBindingIndex(), tView.bindingStartIndex, 'element containers should be created before any bindings');
    const tNode = tView.firstCreatePass ?
        elementContainerStartFirstCreatePass(adjustedIndex, tView, lView, attrsIndex, localRefsIndex) :
        tView.data[adjustedIndex];
    setCurrentTNode(tNode, true);
    const comment = _locateOrCreateElementContainerNode(tView, lView, tNode, index);
    lView[adjustedIndex] = comment;
    if (wasLastNodeCreated()) {
        appendChild(tView, lView, comment, tNode);
    }
    attachPatchData(comment, lView);
    if (isDirectiveHost(tNode)) {
        createDirectivesInstances(tView, lView, tNode);
        executeContentQueries(tView, tNode, lView);
    }
    if (localRefsIndex != null) {
        saveResolvedLocalsInData(lView, tNode);
    }
    return ɵɵelementContainerStart;
}
/**
 * Mark the end of the <ng-container>.
 * @returns This function returns itself so that it may be chained.
 *
 * @codeGenApi
 */
export function ɵɵelementContainerEnd() {
    let currentTNode = getCurrentTNode();
    const tView = getTView();
    if (isCurrentTNodeParent()) {
        setCurrentTNodeAsNotParent();
    }
    else {
        ngDevMode && assertHasParent(currentTNode);
        currentTNode = currentTNode.parent;
        setCurrentTNode(currentTNode, false);
    }
    ngDevMode && assertTNodeType(currentTNode, 8 /* TNodeType.ElementContainer */);
    if (tView.firstCreatePass) {
        registerPostOrderHooks(tView, currentTNode);
        if (isContentQueryHost(currentTNode)) {
            tView.queries.elementEnd(currentTNode);
        }
    }
    return ɵɵelementContainerEnd;
}
/**
 * Creates an empty logical container using {@link elementContainerStart}
 * and {@link elementContainerEnd}
 *
 * @param index Index of the element in the LView array
 * @param attrsIndex Index of the container attributes in the `consts` array.
 * @param localRefsIndex Index of the container's local references in the `consts` array.
 * @returns This function returns itself so that it may be chained.
 *
 * @codeGenApi
 */
export function ɵɵelementContainer(index, attrsIndex, localRefsIndex) {
    ɵɵelementContainerStart(index, attrsIndex, localRefsIndex);
    ɵɵelementContainerEnd();
    return ɵɵelementContainer;
}
let _locateOrCreateElementContainerNode = (tView, lView, tNode, index) => {
    lastNodeWasCreated(true);
    return createCommentNode(lView[RENDERER], ngDevMode ? 'ng-container' : '');
};
/**
 * Enables hydration code path (to lookup existing elements in DOM)
 * in addition to the regular creation mode of comment nodes that
 * represent <ng-container>'s anchor.
 */
function locateOrCreateElementContainerNode(tView, lView, tNode, index) {
    let comment;
    const hydrationInfo = lView[HYDRATION];
    const isNodeCreationMode = !hydrationInfo || isInSkipHydrationBlock();
    lastNodeWasCreated(isNodeCreationMode);
    // Regular creation mode.
    if (isNodeCreationMode) {
        return createCommentNode(lView[RENDERER], ngDevMode ? 'ng-container' : '');
    }
    // Hydration mode, looking up existing elements in DOM.
    const currentRNode = locateNextRNode(hydrationInfo, tView, lView, tNode);
    ngDevMode && validateNodeExists(currentRNode, lView, tNode);
    const ngContainerSize = getNgContainerSize(hydrationInfo, index);
    ngDevMode &&
        assertNumber(ngContainerSize, 'Unexpected state: hydrating an <ng-container>, ' +
            'but no hydration info is available.');
    setSegmentHead(hydrationInfo, index, currentRNode);
    comment = siblingAfter(ngContainerSize, currentRNode);
    if (ngDevMode) {
        validateMatchingNode(comment, Node.COMMENT_NODE, null, lView, tNode);
        markRNodeAsClaimedByHydration(comment);
    }
    return comment;
}
export function enableLocateOrCreateElementContainerNodeImpl() {
    _locateOrCreateElementContainerNode = locateOrCreateElementContainerNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50X2NvbnRhaW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4RixPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQ2hGLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSw2QkFBNkIsRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RyxPQUFPLEVBQUMsV0FBVyxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUdoRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGFBQWEsRUFBRSxTQUFTLEVBQVMsUUFBUSxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDcEYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRSxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSwwQkFBMEIsRUFBRSxrQkFBa0Is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LENBQUUsQ0FBQztJQUVqRSxJQUFJLFNBQVMsRUFBRTtRQUNiLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckUsNkJBQTZCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDeEM7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQsTUFBTSxVQUFVLDRDQUE0QztJQUMxRCxtQ0FBbUMsR0FBRyxrQ0FBa0MsQ0FBQztBQUMzRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge3ZhbGlkYXRlTWF0Y2hpbmdOb2RlLCB2YWxpZGF0ZU5vZGVFeGlzdHN9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge2xvY2F0ZU5leHRSTm9kZSwgc2libGluZ0FmdGVyfSBmcm9tICcuLi8uLi9oeWRyYXRpb24vbm9kZV9sb29rdXBfdXRpbHMnO1xuaW1wb3J0IHtnZXROZ0NvbnRhaW5lclNpemUsIG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9uLCBzZXRTZWdtZW50SGVhZH0gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydEluZGV4SW5SYW5nZSwgYXNzZXJ0TnVtYmVyfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEhhc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7VEF0dHJpYnV0ZXMsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNDb250ZW50UXVlcnlIb3N0LCBpc0RpcmVjdGl2ZUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBIWURSQVRJT04sIExWaWV3LCBSRU5ERVJFUiwgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgY3JlYXRlQ29tbWVudE5vZGV9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0QmluZGluZ0luZGV4LCBnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRUVmlldywgaXNDdXJyZW50VE5vZGVQYXJlbnQsIGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2ssIGxhc3ROb2RlV2FzQ3JlYXRlZCwgc2V0Q3VycmVudFROb2RlLCBzZXRDdXJyZW50VE5vZGVBc05vdFBhcmVudCwgd2FzTGFzdE5vZGVDcmVhdGVkfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2NvbXB1dGVTdGF0aWNTdHlsaW5nfSBmcm9tICcuLi9zdHlsaW5nL3N0YXRpY19zdHlsaW5nJztcbmltcG9ydCB7Z2V0Q29uc3RhbnR9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7Y3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcywgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzLCBnZXRPckNyZWF0ZVROb2RlLCByZXNvbHZlRGlyZWN0aXZlcywgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhfSBmcm9tICcuL3NoYXJlZCc7XG5cbmZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJTdGFydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICBpbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgYXR0cnNJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyKTogVEVsZW1lbnRDb250YWluZXJOb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdENyZWF0ZVBhc3MrKztcblxuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgY29uc3QgYXR0cnMgPSBnZXRDb25zdGFudDxUQXR0cmlidXRlcz4odFZpZXdDb25zdHMsIGF0dHJzSW5kZXgpO1xuICBjb25zdCB0Tm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgJ25nLWNvbnRhaW5lcicsIGF0dHJzKTtcblxuICAvLyBXaGlsZSBuZy1jb250YWluZXIgZG9lc24ndCBuZWNlc3NhcmlseSBzdXBwb3J0IHN0eWxpbmcsIHdlIHVzZSB0aGUgc3R5bGUgY29udGV4dCB0byBpZGVudGlmeVxuICAvLyBhbmQgZXhlY3V0ZSBkaXJlY3RpdmVzIG9uIHRoZSBuZy1jb250YWluZXIuXG4gIGlmIChhdHRycyAhPT0gbnVsbCkge1xuICAgIGNvbXB1dGVTdGF0aWNTdHlsaW5nKHROb2RlLCBhdHRycywgdHJ1ZSk7XG4gIH1cblxuICBjb25zdCBsb2NhbFJlZnMgPSBnZXRDb25zdGFudDxzdHJpbmdbXT4odFZpZXdDb25zdHMsIGxvY2FsUmVmc0luZGV4KTtcbiAgcmVzb2x2ZURpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgbG9jYWxSZWZzKTtcblxuICBpZiAodFZpZXcucXVlcmllcyAhPT0gbnVsbCkge1xuICAgIHRWaWV3LnF1ZXJpZXMuZWxlbWVudFN0YXJ0KHRWaWV3LCB0Tm9kZSk7XG4gIH1cblxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvZ2ljYWwgY29udGFpbmVyIGZvciBvdGhlciBub2RlcyAoPG5nLWNvbnRhaW5lcj4pIGJhY2tlZCBieSBhIGNvbW1lbnQgbm9kZSBpbiB0aGUgRE9NLlxuICogVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRDb250YWluZXJFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0aGUgY29udGFpbmVyIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmc0luZGV4IEluZGV4IG9mIHRoZSBjb250YWluZXIncyBsb2NhbCByZWZlcmVuY2VzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEByZXR1cm5zIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBpdHNlbGYgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqXG4gKiBFdmVuIGlmIHRoaXMgaW5zdHJ1Y3Rpb24gYWNjZXB0cyBhIHNldCBvZiBhdHRyaWJ1dGVzIG5vIGFjdHVhbCBhdHRyaWJ1dGUgdmFsdWVzIGFyZSBwcm9wYWdhdGVkIHRvXG4gKiB0aGUgRE9NIChhcyBhIGNvbW1lbnQgbm9kZSBjYW4ndCBoYXZlIGF0dHJpYnV0ZXMpLiBBdHRyaWJ1dGVzIGFyZSBoZXJlIG9ubHkgZm9yIGRpcmVjdGl2ZVxuICogbWF0Y2hpbmcgcHVycG9zZXMgYW5kIHNldHRpbmcgaW5pdGlhbCBpbnB1dHMgb2YgZGlyZWN0aXZlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRDb250YWluZXJTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBhdHRyc0luZGV4PzogbnVtYmVyfG51bGwsXG4gICAgbG9jYWxSZWZzSW5kZXg/OiBudW1iZXIpOiB0eXBlb2YgybXJtWVsZW1lbnRDb250YWluZXJTdGFydCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGFkanVzdGVkSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGdldEJpbmRpbmdJbmRleCgpLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAnZWxlbWVudCBjb250YWluZXJzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyA/XG4gICAgICBlbGVtZW50Q29udGFpbmVyU3RhcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgYWRqdXN0ZWRJbmRleCwgdFZpZXcsIGxWaWV3LCBhdHRyc0luZGV4LCBsb2NhbFJlZnNJbmRleCkgOlxuICAgICAgdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSBhcyBURWxlbWVudENvbnRhaW5lck5vZGU7XG4gIHNldEN1cnJlbnRUTm9kZSh0Tm9kZSwgdHJ1ZSk7XG5cbiAgY29uc3QgY29tbWVudCA9IF9sb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlKHRWaWV3LCBsVmlldywgdE5vZGUsIGluZGV4KTtcbiAgbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBjb21tZW50O1xuXG4gIGlmICh3YXNMYXN0Tm9kZUNyZWF0ZWQoKSkge1xuICAgIGFwcGVuZENoaWxkKHRWaWV3LCBsVmlldywgY29tbWVudCwgdE5vZGUpO1xuICB9XG4gIGF0dGFjaFBhdGNoRGF0YShjb21tZW50LCBsVmlldyk7XG5cbiAgaWYgKGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSkpIHtcbiAgICBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICAgIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0VmlldywgdE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGlmIChsb2NhbFJlZnNJbmRleCAhPSBudWxsKSB7XG4gICAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxWaWV3LCB0Tm9kZSk7XG4gIH1cblxuICByZXR1cm4gybXJtWVsZW1lbnRDb250YWluZXJTdGFydDtcbn1cblxuLyoqXG4gKiBNYXJrIHRoZSBlbmQgb2YgdGhlIDxuZy1jb250YWluZXI+LlxuICogQHJldHVybnMgVGhpcyBmdW5jdGlvbiByZXR1cm5zIGl0c2VsZiBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudENvbnRhaW5lckVuZCgpOiB0eXBlb2YgybXJtWVsZW1lbnRDb250YWluZXJFbmQge1xuICBsZXQgY3VycmVudFROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGlmIChpc0N1cnJlbnRUTm9kZVBhcmVudCgpKSB7XG4gICAgc2V0Q3VycmVudFROb2RlQXNOb3RQYXJlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KGN1cnJlbnRUTm9kZSk7XG4gICAgY3VycmVudFROb2RlID0gY3VycmVudFROb2RlLnBhcmVudCE7XG4gICAgc2V0Q3VycmVudFROb2RlKGN1cnJlbnRUTm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShjdXJyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyh0VmlldywgY3VycmVudFROb2RlKTtcbiAgICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KGN1cnJlbnRUTm9kZSkpIHtcbiAgICAgIHRWaWV3LnF1ZXJpZXMhLmVsZW1lbnRFbmQoY3VycmVudFROb2RlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIMm1ybVlbGVtZW50Q29udGFpbmVyRW5kO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgbG9naWNhbCBjb250YWluZXIgdXNpbmcge0BsaW5rIGVsZW1lbnRDb250YWluZXJTdGFydH1cbiAqIGFuZCB7QGxpbmsgZWxlbWVudENvbnRhaW5lckVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0aGUgY29udGFpbmVyIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmc0luZGV4IEluZGV4IG9mIHRoZSBjb250YWluZXIncyBsb2NhbCByZWZlcmVuY2VzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEByZXR1cm5zIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBpdHNlbGYgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRDb250YWluZXIoXG4gICAgaW5kZXg6IG51bWJlciwgYXR0cnNJbmRleD86IG51bWJlcnxudWxsLCBsb2NhbFJlZnNJbmRleD86IG51bWJlcik6IHR5cGVvZiDJtcm1ZWxlbWVudENvbnRhaW5lciB7XG4gIMm1ybVlbGVtZW50Q29udGFpbmVyU3RhcnQoaW5kZXgsIGF0dHJzSW5kZXgsIGxvY2FsUmVmc0luZGV4KTtcbiAgybXJtWVsZW1lbnRDb250YWluZXJFbmQoKTtcbiAgcmV0dXJuIMm1ybVlbGVtZW50Q29udGFpbmVyO1xufVxuXG5sZXQgX2xvY2F0ZU9yQ3JlYXRlRWxlbWVudENvbnRhaW5lck5vZGU6IHR5cGVvZiBsb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlID1cbiAgICAodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgbGFzdE5vZGVXYXNDcmVhdGVkKHRydWUpO1xuICAgICAgcmV0dXJuIGNyZWF0ZUNvbW1lbnROb2RlKGxWaWV3W1JFTkRFUkVSXSwgbmdEZXZNb2RlID8gJ25nLWNvbnRhaW5lcicgOiAnJyk7XG4gICAgfTtcblxuLyoqXG4gKiBFbmFibGVzIGh5ZHJhdGlvbiBjb2RlIHBhdGggKHRvIGxvb2t1cCBleGlzdGluZyBlbGVtZW50cyBpbiBET00pXG4gKiBpbiBhZGRpdGlvbiB0byB0aGUgcmVndWxhciBjcmVhdGlvbiBtb2RlIG9mIGNvbW1lbnQgbm9kZXMgdGhhdFxuICogcmVwcmVzZW50IDxuZy1jb250YWluZXI+J3MgYW5jaG9yLlxuICovXG5mdW5jdGlvbiBsb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGluZGV4OiBudW1iZXIpOiBSQ29tbWVudCB7XG4gIGxldCBjb21tZW50OiBSQ29tbWVudDtcbiAgY29uc3QgaHlkcmF0aW9uSW5mbyA9IGxWaWV3W0hZRFJBVElPTl07XG4gIGNvbnN0IGlzTm9kZUNyZWF0aW9uTW9kZSA9ICFoeWRyYXRpb25JbmZvIHx8IGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2soKTtcblxuICBsYXN0Tm9kZVdhc0NyZWF0ZWQoaXNOb2RlQ3JlYXRpb25Nb2RlKTtcblxuICAvLyBSZWd1bGFyIGNyZWF0aW9uIG1vZGUuXG4gIGlmIChpc05vZGVDcmVhdGlvbk1vZGUpIHtcbiAgICByZXR1cm4gY3JlYXRlQ29tbWVudE5vZGUobFZpZXdbUkVOREVSRVJdLCBuZ0Rldk1vZGUgPyAnbmctY29udGFpbmVyJyA6ICcnKTtcbiAgfVxuXG4gIC8vIEh5ZHJhdGlvbiBtb2RlLCBsb29raW5nIHVwIGV4aXN0aW5nIGVsZW1lbnRzIGluIERPTS5cbiAgY29uc3QgY3VycmVudFJOb2RlID0gbG9jYXRlTmV4dFJOb2RlKGh5ZHJhdGlvbkluZm8sIHRWaWV3LCBsVmlldywgdE5vZGUpITtcbiAgbmdEZXZNb2RlICYmIHZhbGlkYXRlTm9kZUV4aXN0cyhjdXJyZW50Uk5vZGUsIGxWaWV3LCB0Tm9kZSk7XG5cbiAgY29uc3QgbmdDb250YWluZXJTaXplID0gZ2V0TmdDb250YWluZXJTaXplKGh5ZHJhdGlvbkluZm8sIGluZGV4KSBhcyBudW1iZXI7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0TnVtYmVyKFxuICAgICAgICAgIG5nQ29udGFpbmVyU2l6ZSxcbiAgICAgICAgICAnVW5leHBlY3RlZCBzdGF0ZTogaHlkcmF0aW5nIGFuIDxuZy1jb250YWluZXI+LCAnICtcbiAgICAgICAgICAgICAgJ2J1dCBubyBoeWRyYXRpb24gaW5mbyBpcyBhdmFpbGFibGUuJyk7XG5cbiAgc2V0U2VnbWVudEhlYWQoaHlkcmF0aW9uSW5mbywgaW5kZXgsIGN1cnJlbnRSTm9kZSk7XG4gIGNvbW1lbnQgPSBzaWJsaW5nQWZ0ZXI8UkNvbW1lbnQ+KG5nQ29udGFpbmVyU2l6ZSwgY3VycmVudFJOb2RlKSE7XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIHZhbGlkYXRlTWF0Y2hpbmdOb2RlKGNvbW1lbnQsIE5vZGUuQ09NTUVOVF9OT0RFLCBudWxsLCBsVmlldywgdE5vZGUpO1xuICAgIG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9uKGNvbW1lbnQpO1xuICB9XG5cbiAgcmV0dXJuIGNvbW1lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbCgpIHtcbiAgX2xvY2F0ZU9yQ3JlYXRlRWxlbWVudENvbnRhaW5lck5vZGUgPSBsb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlO1xufVxuIl19