/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getDocument } from '../render3/interfaces/document';
import { isRootView } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, TVIEW } from '../render3/interfaces/view';
import { makeStateKey, TransferState } from '../transfer_state';
import { assertDefined } from '../util/assert';
import { CONTAINERS, DISCONNECTED_NODES, ELEMENT_CONTAINERS, MULTIPLIER, NUM_ROOT_NODES } from './interfaces';
/**
 * The name of the key used in the TransferState collection,
 * where hydration information is located.
 */
const TRANSFER_STATE_TOKEN_ID = '__ɵnghData__';
/**
 * Lookup key used to reference DOM hydration data (ngh) in `TransferState`.
 */
export const NGH_DATA_KEY = makeStateKey(TRANSFER_STATE_TOKEN_ID);
/**
 * The name of the attribute that would be added to host component
 * nodes and contain a reference to a particular slot in transferred
 * state that contains the necessary hydration info for this component.
 */
export const NGH_ATTR_NAME = 'ngh';
/**
 * Marker used in a comment node to ensure hydration content integrity
 */
export const SSR_CONTENT_INTEGRITY_MARKER = 'nghm';
/**
 * Reference to a function that reads `ngh` attribute value from a given RNode
 * and retrieves hydration information from the TransferState using that value
 * as an index. Returns `null` by default, when hydration is not enabled.
 *
 * @param rNode Component's host element.
 * @param injector Injector that this component has access to.
 * @param isRootView Specifies whether we trying to read hydration info for the root view.
 */
let _retrieveHydrationInfoImpl = (rNode, injector, isRootView) => null;
export function retrieveHydrationInfoImpl(rNode, injector, isRootView = false) {
    let nghAttrValue = rNode.getAttribute(NGH_ATTR_NAME);
    if (nghAttrValue == null)
        return null;
    // For cases when a root component also acts as an anchor node for a ViewContainerRef
    // (for example, when ViewContainerRef is injected in a root component), there is a need
    // to serialize information about the component itself, as well as an LContainer that
    // represents this ViewContainerRef. Effectively, we need to serialize 2 pieces of info:
    // (1) hydration info for the root component itself and (2) hydration info for the
    // ViewContainerRef instance (an LContainer). Each piece of information is included into
    // the hydration data (in the TransferState object) separately, thus we end up with 2 ids.
    // Since we only have 1 root element, we encode both bits of info into a single string:
    // ids are separated by the `|` char (e.g. `10|25`, where `10` is the ngh for a component view
    // and 25 is the `ngh` for a root view which holds LContainer).
    const [componentViewNgh, rootViewNgh] = nghAttrValue.split('|');
    nghAttrValue = isRootView ? rootViewNgh : componentViewNgh;
    if (!nghAttrValue)
        return null;
    // We've read one of the ngh ids, keep the remaining one, so that
    // we can set it back on the DOM element.
    const remainingNgh = isRootView ? componentViewNgh : (rootViewNgh ? `|${rootViewNgh}` : '');
    let data = {};
    // An element might have an empty `ngh` attribute value (e.g. `<comp ngh="" />`),
    // which means that no special annotations are required. Do not attempt to read
    // from the TransferState in this case.
    if (nghAttrValue !== '') {
        const transferState = injector.get(TransferState, null, { optional: true });
        if (transferState !== null) {
            const nghData = transferState.get(NGH_DATA_KEY, []);
            // The nghAttrValue is always a number referencing an index
            // in the hydration TransferState data.
            data = nghData[Number(nghAttrValue)];
            // If the `ngh` attribute exists and has a non-empty value,
            // the hydration info *must* be present in the TransferState.
            // If there is no data for some reasons, this is an error.
            ngDevMode && assertDefined(data, 'Unable to retrieve hydration info from the TransferState.');
        }
    }
    const dehydratedView = {
        data,
        firstChild: rNode.firstChild ?? null,
    };
    if (isRootView) {
        // If there is hydration info present for the root view, it means that there was
        // a ViewContainerRef injected in the root component. The root component host element
        // acted as an anchor node in this scenario. As a result, the DOM nodes that represent
        // embedded views in this ViewContainerRef are located as siblings to the host node,
        // i.e. `<app-root /><#VIEW1><#VIEW2>...<!--container-->`. In this case, the current
        // node becomes the first child of this root view and the next sibling is the first
        // element in the DOM segment.
        dehydratedView.firstChild = rNode;
        // We use `0` here, since this is the slot (right after the HEADER_OFFSET)
        // where a component LView or an LContainer is located in a root LView.
        setSegmentHead(dehydratedView, 0, rNode.nextSibling);
    }
    if (remainingNgh) {
        // If we have only used one of the ngh ids, store the remaining one
        // back on this RNode.
        rNode.setAttribute(NGH_ATTR_NAME, remainingNgh);
    }
    else {
        // The `ngh` attribute is cleared from the DOM node now
        // that the data has been retrieved for all indices.
        rNode.removeAttribute(NGH_ATTR_NAME);
    }
    // Note: don't check whether this node was claimed for hydration,
    // because this node might've been previously claimed while processing
    // template instructions.
    ngDevMode && markRNodeAsClaimedByHydration(rNode, /* checkIfAlreadyClaimed */ false);
    ngDevMode && ngDevMode.hydratedComponents++;
    return dehydratedView;
}
/**
 * Sets the implementation for the `retrieveHydrationInfo` function.
 */
export function enableRetrieveHydrationInfoImpl() {
    _retrieveHydrationInfoImpl = retrieveHydrationInfoImpl;
}
/**
 * Retrieves hydration info by reading the value from the `ngh` attribute
 * and accessing a corresponding slot in TransferState storage.
 */
export function retrieveHydrationInfo(rNode, injector, isRootView = false) {
    return _retrieveHydrationInfoImpl(rNode, injector, isRootView);
}
/**
 * Retrieves the necessary object from a given ViewRef to serialize:
 *  - an LView for component views
 *  - an LContainer for cases when component acts as a ViewContainerRef anchor
 *  - `null` in case of an embedded view
 */
export function getLNodeForHydration(viewRef) {
    // Reading an internal field from `ViewRef` instance.
    let lView = viewRef._lView;
    const tView = lView[TVIEW];
    // A registered ViewRef might represent an instance of an
    // embedded view, in which case we do not need to annotate it.
    if (tView.type === 2 /* TViewType.Embedded */) {
        return null;
    }
    // Check if it's a root view and if so, retrieve component's
    // LView from the first slot after the header.
    if (isRootView(lView)) {
        lView = lView[HEADER_OFFSET];
    }
    return lView;
}
function getTextNodeContent(node) {
    return node.textContent?.replace(/\s/gm, '');
}
/**
 * Restores text nodes and separators into the DOM that were lost during SSR
 * serialization. The hydration process replaces empty text nodes and text
 * nodes that are immediately adjacent to other text nodes with comment nodes
 * that this method filters on to restore those missing nodes that the
 * hydration process is expecting to be present.
 *
 * @param node The app's root HTML Element
 */
export function processTextNodeMarkersBeforeHydration(node) {
    const doc = getDocument();
    const commentNodesIterator = doc.createNodeIterator(node, NodeFilter.SHOW_COMMENT, {
        acceptNode(node) {
            const content = getTextNodeContent(node);
            const isTextNodeMarker = content === "ngetn" /* TextNodeMarker.EmptyNode */ || content === "ngtns" /* TextNodeMarker.Separator */;
            return isTextNodeMarker ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });
    let currentNode;
    // We cannot modify the DOM while using the commentIterator,
    // because it throws off the iterator state.
    // So we collect all marker nodes first and then follow up with
    // applying the changes to the DOM: either inserting an empty node
    // or just removing the marker if it was used as a separator.
    const nodes = [];
    while (currentNode = commentNodesIterator.nextNode()) {
        nodes.push(currentNode);
    }
    for (const node of nodes) {
        if (node.textContent === "ngetn" /* TextNodeMarker.EmptyNode */) {
            node.replaceWith(doc.createTextNode(''));
        }
        else {
            node.remove();
        }
    }
}
/**
 * Marks a node as "claimed" by hydration process.
 * This is needed to make assessments in tests whether
 * the hydration process handled all nodes.
 */
export function markRNodeAsClaimedByHydration(node, checkIfAlreadyClaimed = true) {
    if (!ngDevMode) {
        throw new Error('Calling `markRNodeAsClaimedByHydration` in prod mode ' +
            'is not supported and likely a mistake.');
    }
    if (checkIfAlreadyClaimed && isRNodeClaimedForHydration(node)) {
        throw new Error('Trying to claim a node, which was claimed already.');
    }
    node.__claimed = true;
    ngDevMode.hydratedNodes++;
}
export function isRNodeClaimedForHydration(node) {
    return !!node.__claimed;
}
export function setSegmentHead(hydrationInfo, index, node) {
    hydrationInfo.segmentHeads ??= {};
    hydrationInfo.segmentHeads[index] = node;
}
export function getSegmentHead(hydrationInfo, index) {
    return hydrationInfo.segmentHeads?.[index] ?? null;
}
/**
 * Returns the size of an <ng-container>, using either the information
 * serialized in `ELEMENT_CONTAINERS` (element container size) or by
 * computing the sum of root nodes in all dehydrated views in a given
 * container (in case this `<ng-container>` was also used as a view
 * container host node, e.g. <ng-container *ngIf>).
 */
export function getNgContainerSize(hydrationInfo, index) {
    const data = hydrationInfo.data;
    let size = data[ELEMENT_CONTAINERS]?.[index] ?? null;
    // If there is no serialized information available in the `ELEMENT_CONTAINERS` slot,
    // check if we have info about view containers at this location (e.g.
    // `<ng-container *ngIf>`) and use container size as a number of root nodes in this
    // element container.
    if (size === null && data[CONTAINERS]?.[index]) {
        size = calcSerializedContainerSize(hydrationInfo, index);
    }
    return size;
}
export function getSerializedContainerViews(hydrationInfo, index) {
    return hydrationInfo.data[CONTAINERS]?.[index] ?? null;
}
/**
 * Computes the size of a serialized container (the number of root nodes)
 * by calculating the sum of root nodes in all dehydrated views in this container.
 */
export function calcSerializedContainerSize(hydrationInfo, index) {
    const views = getSerializedContainerViews(hydrationInfo, index) ?? [];
    let numNodes = 0;
    for (let view of views) {
        numNodes += view[NUM_ROOT_NODES] * (view[MULTIPLIER] ?? 1);
    }
    return numNodes;
}
/**
 * Checks whether a node is annotated as "disconnected", i.e. not present
 * in the DOM at serialization time. We should not attempt hydration for
 * such nodes and instead, use a regular "creation mode".
 */
export function isDisconnectedNode(hydrationInfo, index) {
    // Check if we are processing disconnected info for the first time.
    if (typeof hydrationInfo.disconnectedNodes === 'undefined') {
        const nodeIds = hydrationInfo.data[DISCONNECTED_NODES];
        hydrationInfo.disconnectedNodes = nodeIds ? (new Set(nodeIds)) : null;
    }
    return !!hydrationInfo.disconnectedNodes?.has(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7OztHQU1HO0FBS0gsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFTLEtBQUssRUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxVQUFVLEVBQWtCLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQTBDLE1BQU0sY0FBYyxDQUFDO0FBRXJLOzs7R0FHRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsY0FBYyxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBd0IsdUJBQXVCLENBQUMsQ0FBQztBQUV6Rjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUVuQzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLDRCQUE0QixHQUFHLE1BQU0sQ0FBQztBQXVCbkQ7Ozs7Ozs7O0dBUUc7QUFDSCxJQUFJLDBCQUEwQixHQUMxQixDQUFDLEtBQWUsRUFBRSxRQUFrQixFQUFFLFVBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQztBQUV4RSxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLEtBQWUsRUFBRSxRQUFrQixFQUFFLFVBQVUsR0FBRyxLQUFLO0lBQ3pELElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZ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LGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdEUsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO1FBQ3RCLFFBQVEsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDNUQ7SUFDRCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxhQUE2QixFQUFFLEtBQWE7SUFDN0UsbUVBQW1FO0lBQ25FLElBQUksT0FBTyxhQUFhLENBQUMsaUJBQWlCLEtBQUssV0FBVyxFQUFFO1FBQzFELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN2RCxhQUFhLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUN2RTtJQUNELE9BQU8sQ0FBQyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvZG9jdW1lbnQnO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc1Jvb3RWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgVFZJRVcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHttYWtlU3RhdGVLZXksIFRyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0NPTlRBSU5FUlMsIERlaHlkcmF0ZWRWaWV3LCBESVNDT05ORUNURURfTk9ERVMsIEVMRU1FTlRfQ09OVEFJTkVSUywgTVVMVElQTElFUiwgTlVNX1JPT1RfTk9ERVMsIFNlcmlhbGl6ZWRDb250YWluZXJWaWV3LCBTZXJpYWxpemVkVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzJztcblxuLyoqXG4gKiBUaGUgbmFtZSBvZiB0aGUga2V5IHVzZWQgaW4gdGhlIFRyYW5zZmVyU3RhdGUgY29sbGVjdGlvbixcbiAqIHdoZXJlIGh5ZHJhdGlvbiBpbmZvcm1hdGlvbiBpcyBsb2NhdGVkLlxuICovXG5jb25zdCBUUkFOU0ZFUl9TVEFURV9UT0tFTl9JRCA9ICdfX8m1bmdoRGF0YV9fJztcblxuLyoqXG4gKiBMb29rdXAga2V5IHVzZWQgdG8gcmVmZXJlbmNlIERPTSBoeWRyYXRpb24gZGF0YSAobmdoKSBpbiBgVHJhbnNmZXJTdGF0ZWAuXG4gKi9cbmV4cG9ydCBjb25zdCBOR0hfREFUQV9LRVkgPSBtYWtlU3RhdGVLZXk8QXJyYXk8U2VyaWFsaXplZFZpZXc+PihUUkFOU0ZFUl9TVEFURV9UT0tFTl9JRCk7XG5cbi8qKlxuICogVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0aGF0IHdvdWxkIGJlIGFkZGVkIHRvIGhvc3QgY29tcG9uZW50XG4gKiBub2RlcyBhbmQgY29udGFpbiBhIHJlZmVyZW5jZSB0byBhIHBhcnRpY3VsYXIgc2xvdCBpbiB0cmFuc2ZlcnJlZFxuICogc3RhdGUgdGhhdCBjb250YWlucyB0aGUgbmVjZXNzYXJ5IGh5ZHJhdGlvbiBpbmZvIGZvciB0aGlzIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IE5HSF9BVFRSX05BTUUgPSAnbmdoJztcblxuLyoqXG4gKiBNYXJrZXIgdXNlZCBpbiBhIGNvbW1lbnQgbm9kZSB0byBlbnN1cmUgaHlkcmF0aW9uIGNvbnRlbnQgaW50ZWdyaXR5XG4gKi9cbmV4cG9ydCBjb25zdCBTU1JfQ09OVEVOVF9JTlRFR1JJVFlfTUFSS0VSID0gJ25naG0nO1xuXG5leHBvcnQgY29uc3QgZW51bSBUZXh0Tm9kZU1hcmtlciB7XG5cbiAgLyoqXG4gICAqIFRoZSBjb250ZW50cyBvZiB0aGUgdGV4dCBjb21tZW50IGFkZGVkIHRvIG5vZGVzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGJlXG4gICAqIGVtcHR5IHdoZW4gc2VyaWFsaXplZCBieSB0aGUgc2VydmVyIGFuZCBwYXNzZWQgdG8gdGhlIGNsaWVudC4gVGhlIGVtcHR5XG4gICAqIG5vZGUgaXMgbG9zdCB3aGVuIHRoZSBicm93c2VyIHBhcnNlcyBpdCBvdGhlcndpc2UuIFRoaXMgY29tbWVudCBub2RlIHdpbGxcbiAgICogYmUgcmVwbGFjZWQgZHVyaW5nIGh5ZHJhdGlvbiBpbiB0aGUgY2xpZW50IHRvIHJlc3RvcmUgdGhlIGxvc3QgZW1wdHkgdGV4dFxuICAgKiBub2RlLlxuICAgKi9cbiAgRW1wdHlOb2RlID0gJ25nZXRuJyxcblxuICAvKipcbiAgICogVGhlIGNvbnRlbnRzIG9mIHRoZSB0ZXh0IGNvbW1lbnQgYWRkZWQgaW4gdGhlIGNhc2Ugb2YgYWRqYWNlbnQgdGV4dCBub2Rlcy5cbiAgICogV2hlbiBhZGphY2VudCB0ZXh0IG5vZGVzIGFyZSBzZXJpYWxpemVkIGJ5IHRoZSBzZXJ2ZXIgYW5kIHNlbnQgdG8gdGhlXG4gICAqIGNsaWVudCwgdGhlIGJyb3dzZXIgbG9zZXMgcmVmZXJlbmNlIHRvIHRoZSBhbW91bnQgb2Ygbm9kZXMgYW5kIGFzc3VtZXNcbiAgICoganVzdCBvbmUgdGV4dCBub2RlLiBUaGlzIHNlcGFyYXRvciBpcyByZXBsYWNlZCBkdXJpbmcgaHlkcmF0aW9uIHRvIHJlc3RvcmVcbiAgICogdGhlIHByb3BlciBzZXBhcmF0aW9uIGFuZCBhbW91bnQgb2YgdGV4dCBub2RlcyB0aGF0IHNob3VsZCBiZSBwcmVzZW50LlxuICAgKi9cbiAgU2VwYXJhdG9yID0gJ25ndG5zJyxcbn1cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBmdW5jdGlvbiB0aGF0IHJlYWRzIGBuZ2hgIGF0dHJpYnV0ZSB2YWx1ZSBmcm9tIGEgZ2l2ZW4gUk5vZGVcbiAqIGFuZCByZXRyaWV2ZXMgaHlkcmF0aW9uIGluZm9ybWF0aW9uIGZyb20gdGhlIFRyYW5zZmVyU3RhdGUgdXNpbmcgdGhhdCB2YWx1ZVxuICogYXMgYW4gaW5kZXguIFJldHVybnMgYG51bGxgIGJ5IGRlZmF1bHQsIHdoZW4gaHlkcmF0aW9uIGlzIG5vdCBlbmFibGVkLlxuICpcbiAqIEBwYXJhbSByTm9kZSBDb21wb25lbnQncyBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gaW5qZWN0b3IgSW5qZWN0b3IgdGhhdCB0aGlzIGNvbXBvbmVudCBoYXMgYWNjZXNzIHRvLlxuICogQHBhcmFtIGlzUm9vdFZpZXcgU3BlY2lmaWVzIHdoZXRoZXIgd2UgdHJ5aW5nIHRvIHJlYWQgaHlkcmF0aW9uIGluZm8gZm9yIHRoZSByb290IHZpZXcuXG4gKi9cbmxldCBfcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbDogdHlwZW9mIHJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwgPVxuICAgIChyTm9kZTogUkVsZW1lbnQsIGluamVjdG9yOiBJbmplY3RvciwgaXNSb290Vmlldz86IGJvb2xlYW4pID0+IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKFxuICAgIHJOb2RlOiBSRWxlbWVudCwgaW5qZWN0b3I6IEluamVjdG9yLCBpc1Jvb3RWaWV3ID0gZmFsc2UpOiBEZWh5ZHJhdGVkVmlld3xudWxsIHtcbiAgbGV0IG5naEF0dHJWYWx1ZSA9IHJOb2RlLmdldEF0dHJpYnV0ZShOR0hfQVRUUl9OQU1FKTtcbiAgaWYgKG5naEF0dHJWYWx1ZSA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAvLyBGb3IgY2FzZXMgd2hlbiBhIHJvb3QgY29tcG9uZW50IGFsc28gYWN0cyBhcyBhbiBhbmNob3Igbm9kZSBmb3IgYSBWaWV3Q29udGFpbmVyUmVmXG4gIC8vIChmb3IgZXhhbXBsZSwgd2hlbiBWaWV3Q29udGFpbmVyUmVmIGlzIGluamVjdGVkIGluIGEgcm9vdCBjb21wb25lbnQpLCB0aGVyZSBpcyBhIG5lZWRcbiAgLy8gdG8gc2VyaWFsaXplIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb21wb25lbnQgaXRzZWxmLCBhcyB3ZWxsIGFzIGFuIExDb250YWluZXIgdGhhdFxuICAvLyByZXByZXNlbnRzIHRoaXMgVmlld0NvbnRhaW5lclJlZi4gRWZmZWN0aXZlbHksIHdlIG5lZWQgdG8gc2VyaWFsaXplIDIgcGllY2VzIG9mIGluZm86XG4gIC8vICgxKSBoeWRyYXRpb24gaW5mbyBmb3IgdGhlIHJvb3QgY29tcG9uZW50IGl0c2VsZiBhbmQgKDIpIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGVcbiAgLy8gVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSAoYW4gTENvbnRhaW5lcikuIEVhY2ggcGllY2Ugb2YgaW5mb3JtYXRpb24gaXMgaW5jbHVkZWQgaW50b1xuICAvLyB0aGUgaHlkcmF0aW9uIGRhdGEgKGluIHRoZSBUcmFuc2ZlclN0YXRlIG9iamVjdCkgc2VwYXJhdGVseSwgdGh1cyB3ZSBlbmQgdXAgd2l0aCAyIGlkcy5cbiAgLy8gU2luY2Ugd2Ugb25seSBoYXZlIDEgcm9vdCBlbGVtZW50LCB3ZSBlbmNvZGUgYm90aCBiaXRzIG9mIGluZm8gaW50byBhIHNpbmdsZSBzdHJpbmc6XG4gIC8vIGlkcyBhcmUgc2VwYXJhdGVkIGJ5IHRoZSBgfGAgY2hhciAoZS5nLiBgMTB8MjVgLCB3aGVyZSBgMTBgIGlzIHRoZSBuZ2ggZm9yIGEgY29tcG9uZW50IHZpZXdcbiAgLy8gYW5kIDI1IGlzIHRoZSBgbmdoYCBmb3IgYSByb290IHZpZXcgd2hpY2ggaG9sZHMgTENvbnRhaW5lcikuXG4gIGNvbnN0IFtjb21wb25lbnRWaWV3TmdoLCByb290Vmlld05naF0gPSBuZ2hBdHRyVmFsdWUuc3BsaXQoJ3wnKTtcbiAgbmdoQXR0clZhbHVlID0gaXNSb290VmlldyA/IHJvb3RWaWV3TmdoIDogY29tcG9uZW50Vmlld05naDtcbiAgaWYgKCFuZ2hBdHRyVmFsdWUpIHJldHVybiBudWxsO1xuXG4gIC8vIFdlJ3ZlIHJlYWQgb25lIG9mIHRoZSBuZ2ggaWRzLCBrZWVwIHRoZSByZW1haW5pbmcgb25lLCBzbyB0aGF0XG4gIC8vIHdlIGNhbiBzZXQgaXQgYmFjayBvbiB0aGUgRE9NIGVsZW1lbnQuXG4gIGNvbnN0IHJlbWFpbmluZ05naCA9IGlzUm9vdFZpZXcgPyBjb21wb25lbnRWaWV3TmdoIDogKHJvb3RWaWV3TmdoID8gYHwke3Jvb3RWaWV3TmdofWAgOiAnJyk7XG5cbiAgbGV0IGRhdGE6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIC8vIEFuIGVsZW1lbnQgbWlnaHQgaGF2ZSBhbiBlbXB0eSBgbmdoYCBhdHRyaWJ1dGUgdmFsdWUgKGUuZy4gYDxjb21wIG5naD1cIlwiIC8+YCksXG4gIC8vIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3BlY2lhbCBhbm5vdGF0aW9ucyBhcmUgcmVxdWlyZWQuIERvIG5vdCBhdHRlbXB0IHRvIHJlYWRcbiAgLy8gZnJvbSB0aGUgVHJhbnNmZXJTdGF0ZSBpbiB0aGlzIGNhc2UuXG4gIGlmIChuZ2hBdHRyVmFsdWUgIT09ICcnKSB7XG4gICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGluamVjdG9yLmdldChUcmFuc2ZlclN0YXRlLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgICBpZiAodHJhbnNmZXJTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgbmdoRGF0YSA9IHRyYW5zZmVyU3RhdGUuZ2V0KE5HSF9EQVRBX0tFWSwgW10pO1xuXG4gICAgICAvLyBUaGUgbmdoQXR0clZhbHVlIGlzIGFsd2F5cyBhIG51bWJlciByZWZlcmVuY2luZyBhbiBpbmRleFxuICAgICAgLy8gaW4gdGhlIGh5ZHJhdGlvbiBUcmFuc2ZlclN0YXRlIGRhdGEuXG4gICAgICBkYXRhID0gbmdoRGF0YVtOdW1iZXIobmdoQXR0clZhbHVlKV07XG5cbiAgICAgIC8vIElmIHRoZSBgbmdoYCBhdHRyaWJ1dGUgZXhpc3RzIGFuZCBoYXMgYSBub24tZW1wdHkgdmFsdWUsXG4gICAgICAvLyB0aGUgaHlkcmF0aW9uIGluZm8gKm11c3QqIGJlIHByZXNlbnQgaW4gdGhlIFRyYW5zZmVyU3RhdGUuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBkYXRhIGZvciBzb21lIHJlYXNvbnMsIHRoaXMgaXMgYW4gZXJyb3IuXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkYXRhLCAnVW5hYmxlIHRvIHJldHJpZXZlIGh5ZHJhdGlvbiBpbmZvIGZyb20gdGhlIFRyYW5zZmVyU3RhdGUuJyk7XG4gICAgfVxuICB9XG4gIGNvbnN0IGRlaHlkcmF0ZWRWaWV3OiBEZWh5ZHJhdGVkVmlldyA9IHtcbiAgICBkYXRhLFxuICAgIGZpcnN0Q2hpbGQ6IHJOb2RlLmZpcnN0Q2hpbGQgPz8gbnVsbCxcbiAgfTtcblxuICBpZiAoaXNSb290Vmlldykge1xuICAgIC8vIElmIHRoZXJlIGlzIGh5ZHJhdGlvbiBpbmZvIHByZXNlbnQgZm9yIHRoZSByb290IHZpZXcsIGl0IG1lYW5zIHRoYXQgdGhlcmUgd2FzXG4gICAgLy8gYSBWaWV3Q29udGFpbmVyUmVmIGluamVjdGVkIGluIHRoZSByb290IGNvbXBvbmVudC4gVGhlIHJvb3QgY29tcG9uZW50IGhvc3QgZWxlbWVudFxuICAgIC8vIGFjdGVkIGFzIGFuIGFuY2hvciBub2RlIGluIHRoaXMgc2NlbmFyaW8uIEFzIGEgcmVzdWx0LCB0aGUgRE9NIG5vZGVzIHRoYXQgcmVwcmVzZW50XG4gICAgLy8gZW1iZWRkZWQgdmlld3MgaW4gdGhpcyBWaWV3Q29udGFpbmVyUmVmIGFyZSBsb2NhdGVkIGFzIHNpYmxpbmdzIHRvIHRoZSBob3N0IG5vZGUsXG4gICAgLy8gaS5lLiBgPGFwcC1yb290IC8+PCNWSUVXMT48I1ZJRVcyPi4uLjwhLS1jb250YWluZXItLT5gLiBJbiB0aGlzIGNhc2UsIHRoZSBjdXJyZW50XG4gICAgLy8gbm9kZSBiZWNvbWVzIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGlzIHJvb3QgdmlldyBhbmQgdGhlIG5leHQgc2libGluZyBpcyB0aGUgZmlyc3RcbiAgICAvLyBlbGVtZW50IGluIHRoZSBET00gc2VnbWVudC5cbiAgICBkZWh5ZHJhdGVkVmlldy5maXJzdENoaWxkID0gck5vZGU7XG5cbiAgICAvLyBXZSB1c2UgYDBgIGhlcmUsIHNpbmNlIHRoaXMgaXMgdGhlIHNsb3QgKHJpZ2h0IGFmdGVyIHRoZSBIRUFERVJfT0ZGU0VUKVxuICAgIC8vIHdoZXJlIGEgY29tcG9uZW50IExWaWV3IG9yIGFuIExDb250YWluZXIgaXMgbG9jYXRlZCBpbiBhIHJvb3QgTFZpZXcuXG4gICAgc2V0U2VnbWVudEhlYWQoZGVoeWRyYXRlZFZpZXcsIDAsIHJOb2RlLm5leHRTaWJsaW5nKTtcbiAgfVxuXG4gIGlmIChyZW1haW5pbmdOZ2gpIHtcbiAgICAvLyBJZiB3ZSBoYXZlIG9ubHkgdXNlZCBvbmUgb2YgdGhlIG5naCBpZHMsIHN0b3JlIHRoZSByZW1haW5pbmcgb25lXG4gICAgLy8gYmFjayBvbiB0aGlzIFJOb2RlLlxuICAgIHJOb2RlLnNldEF0dHJpYnV0ZShOR0hfQVRUUl9OQU1FLCByZW1haW5pbmdOZ2gpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBgbmdoYCBhdHRyaWJ1dGUgaXMgY2xlYXJlZCBmcm9tIHRoZSBET00gbm9kZSBub3dcbiAgICAvLyB0aGF0IHRoZSBkYXRhIGhhcyBiZWVuIHJldHJpZXZlZCBmb3IgYWxsIGluZGljZXMuXG4gICAgck5vZGUucmVtb3ZlQXR0cmlidXRlKE5HSF9BVFRSX05BTUUpO1xuICB9XG5cbiAgLy8gTm90ZTogZG9uJ3QgY2hlY2sgd2hldGhlciB0aGlzIG5vZGUgd2FzIGNsYWltZWQgZm9yIGh5ZHJhdGlvbixcbiAgLy8gYmVjYXVzZSB0aGlzIG5vZGUgbWlnaHQndmUgYmVlbiBwcmV2aW91c2x5IGNsYWltZWQgd2hpbGUgcHJvY2Vzc2luZ1xuICAvLyB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMuXG4gIG5nRGV2TW9kZSAmJiBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbihyTm9kZSwgLyogY2hlY2tJZkFscmVhZHlDbGFpbWVkICovIGZhbHNlKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5oeWRyYXRlZENvbXBvbmVudHMrKztcblxuICByZXR1cm4gZGVoeWRyYXRlZFZpZXc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgaW1wbGVtZW50YXRpb24gZm9yIHRoZSBgcmV0cmlldmVIeWRyYXRpb25JbmZvYCBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwoKSB7XG4gIF9yZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsID0gcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgaHlkcmF0aW9uIGluZm8gYnkgcmVhZGluZyB0aGUgdmFsdWUgZnJvbSB0aGUgYG5naGAgYXR0cmlidXRlXG4gKiBhbmQgYWNjZXNzaW5nIGEgY29ycmVzcG9uZGluZyBzbG90IGluIFRyYW5zZmVyU3RhdGUgc3RvcmFnZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJldHJpZXZlSHlkcmF0aW9uSW5mbyhcbiAgICByTm9kZTogUkVsZW1lbnQsIGluamVjdG9yOiBJbmplY3RvciwgaXNSb290VmlldyA9IGZhbHNlKTogRGVoeWRyYXRlZFZpZXd8bnVsbCB7XG4gIHJldHVybiBfcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbChyTm9kZSwgaW5qZWN0b3IsIGlzUm9vdFZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgbmVjZXNzYXJ5IG9iamVjdCBmcm9tIGEgZ2l2ZW4gVmlld1JlZiB0byBzZXJpYWxpemU6XG4gKiAgLSBhbiBMVmlldyBmb3IgY29tcG9uZW50IHZpZXdzXG4gKiAgLSBhbiBMQ29udGFpbmVyIGZvciBjYXNlcyB3aGVuIGNvbXBvbmVudCBhY3RzIGFzIGEgVmlld0NvbnRhaW5lclJlZiBhbmNob3JcbiAqICAtIGBudWxsYCBpbiBjYXNlIG9mIGFuIGVtYmVkZGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExOb2RlRm9ySHlkcmF0aW9uKHZpZXdSZWY6IFZpZXdSZWYpOiBMVmlld3xMQ29udGFpbmVyfG51bGwge1xuICAvLyBSZWFkaW5nIGFuIGludGVybmFsIGZpZWxkIGZyb20gYFZpZXdSZWZgIGluc3RhbmNlLlxuICBsZXQgbFZpZXcgPSAodmlld1JlZiBhcyBhbnkpLl9sVmlldyBhcyBMVmlldztcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIEEgcmVnaXN0ZXJlZCBWaWV3UmVmIG1pZ2h0IHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhblxuICAvLyBlbWJlZGRlZCB2aWV3LCBpbiB3aGljaCBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGFubm90YXRlIGl0LlxuICBpZiAodFZpZXcudHlwZSA9PT0gVFZpZXdUeXBlLkVtYmVkZGVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gQ2hlY2sgaWYgaXQncyBhIHJvb3QgdmlldyBhbmQgaWYgc28sIHJldHJpZXZlIGNvbXBvbmVudCdzXG4gIC8vIExWaWV3IGZyb20gdGhlIGZpcnN0IHNsb3QgYWZ0ZXIgdGhlIGhlYWRlci5cbiAgaWYgKGlzUm9vdFZpZXcobFZpZXcpKSB7XG4gICAgbFZpZXcgPSBsVmlld1tIRUFERVJfT0ZGU0VUXTtcbiAgfVxuXG4gIHJldHVybiBsVmlldztcbn1cblxuZnVuY3Rpb24gZ2V0VGV4dE5vZGVDb250ZW50KG5vZGU6IE5vZGUpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ/LnJlcGxhY2UoL1xccy9nbSwgJycpO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIHRleHQgbm9kZXMgYW5kIHNlcGFyYXRvcnMgaW50byB0aGUgRE9NIHRoYXQgd2VyZSBsb3N0IGR1cmluZyBTU1JcbiAqIHNlcmlhbGl6YXRpb24uIFRoZSBoeWRyYXRpb24gcHJvY2VzcyByZXBsYWNlcyBlbXB0eSB0ZXh0IG5vZGVzIGFuZCB0ZXh0XG4gKiBub2RlcyB0aGF0IGFyZSBpbW1lZGlhdGVseSBhZGphY2VudCB0byBvdGhlciB0ZXh0IG5vZGVzIHdpdGggY29tbWVudCBub2Rlc1xuICogdGhhdCB0aGlzIG1ldGhvZCBmaWx0ZXJzIG9uIHRvIHJlc3RvcmUgdGhvc2UgbWlzc2luZyBub2RlcyB0aGF0IHRoZVxuICogaHlkcmF0aW9uIHByb2Nlc3MgaXMgZXhwZWN0aW5nIHRvIGJlIHByZXNlbnQuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIGFwcCdzIHJvb3QgSFRNTCBFbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzVGV4dE5vZGVNYXJrZXJzQmVmb3JlSHlkcmF0aW9uKG5vZGU6IEhUTUxFbGVtZW50KSB7XG4gIGNvbnN0IGRvYyA9IGdldERvY3VtZW50KCk7XG4gIGNvbnN0IGNvbW1lbnROb2Rlc0l0ZXJhdG9yID0gZG9jLmNyZWF0ZU5vZGVJdGVyYXRvcihub2RlLCBOb2RlRmlsdGVyLlNIT1dfQ09NTUVOVCwge1xuICAgIGFjY2VwdE5vZGUobm9kZSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGdldFRleHROb2RlQ29udGVudChub2RlKTtcbiAgICAgIGNvbnN0IGlzVGV4dE5vZGVNYXJrZXIgPVxuICAgICAgICAgIGNvbnRlbnQgPT09IFRleHROb2RlTWFya2VyLkVtcHR5Tm9kZSB8fCBjb250ZW50ID09PSBUZXh0Tm9kZU1hcmtlci5TZXBhcmF0b3I7XG4gICAgICByZXR1cm4gaXNUZXh0Tm9kZU1hcmtlciA/IE5vZGVGaWx0ZXIuRklMVEVSX0FDQ0VQVCA6IE5vZGVGaWx0ZXIuRklMVEVSX1JFSkVDVDtcbiAgICB9XG4gIH0pO1xuICBsZXQgY3VycmVudE5vZGU6IENvbW1lbnQ7XG4gIC8vIFdlIGNhbm5vdCBtb2RpZnkgdGhlIERPTSB3aGlsZSB1c2luZyB0aGUgY29tbWVudEl0ZXJhdG9yLFxuICAvLyBiZWNhdXNlIGl0IHRocm93cyBvZmYgdGhlIGl0ZXJhdG9yIHN0YXRlLlxuICAvLyBTbyB3ZSBjb2xsZWN0IGFsbCBtYXJrZXIgbm9kZXMgZmlyc3QgYW5kIHRoZW4gZm9sbG93IHVwIHdpdGhcbiAgLy8gYXBwbHlpbmcgdGhlIGNoYW5nZXMgdG8gdGhlIERPTTogZWl0aGVyIGluc2VydGluZyBhbiBlbXB0eSBub2RlXG4gIC8vIG9yIGp1c3QgcmVtb3ZpbmcgdGhlIG1hcmtlciBpZiBpdCB3YXMgdXNlZCBhcyBhIHNlcGFyYXRvci5cbiAgY29uc3Qgbm9kZXMgPSBbXTtcbiAgd2hpbGUgKGN1cnJlbnROb2RlID0gY29tbWVudE5vZGVzSXRlcmF0b3IubmV4dE5vZGUoKSBhcyBDb21tZW50KSB7XG4gICAgbm9kZXMucHVzaChjdXJyZW50Tm9kZSk7XG4gIH1cbiAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQgPT09IFRleHROb2RlTWFya2VyLkVtcHR5Tm9kZSkge1xuICAgICAgbm9kZS5yZXBsYWNlV2l0aChkb2MuY3JlYXRlVGV4dE5vZGUoJycpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5yZW1vdmUoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIHRoYXQgcmVwcmVzZW50cyBhIGNsYWltZWQgbm9kZS5cbiAqIE9ubHkgdXNlZCBpbiBkZXYgbW9kZS5cbiAqL1xudHlwZSBDbGFpbWVkTm9kZSA9IHtcbiAgX19jbGFpbWVkPzogYm9vbGVhbjtcbn07XG5cbi8qKlxuICogTWFya3MgYSBub2RlIGFzIFwiY2xhaW1lZFwiIGJ5IGh5ZHJhdGlvbiBwcm9jZXNzLlxuICogVGhpcyBpcyBuZWVkZWQgdG8gbWFrZSBhc3Nlc3NtZW50cyBpbiB0ZXN0cyB3aGV0aGVyXG4gKiB0aGUgaHlkcmF0aW9uIHByb2Nlc3MgaGFuZGxlZCBhbGwgbm9kZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbihub2RlOiBSTm9kZSwgY2hlY2tJZkFscmVhZHlDbGFpbWVkID0gdHJ1ZSkge1xuICBpZiAoIW5nRGV2TW9kZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0NhbGxpbmcgYG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9uYCBpbiBwcm9kIG1vZGUgJyArXG4gICAgICAgICdpcyBub3Qgc3VwcG9ydGVkIGFuZCBsaWtlbHkgYSBtaXN0YWtlLicpO1xuICB9XG4gIGlmIChjaGVja0lmQWxyZWFkeUNsYWltZWQgJiYgaXNSTm9kZUNsYWltZWRGb3JIeWRyYXRpb24obm9kZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyeWluZyB0byBjbGFpbSBhIG5vZGUsIHdoaWNoIHdhcyBjbGFpbWVkIGFscmVhZHkuJyk7XG4gIH1cbiAgKG5vZGUgYXMgQ2xhaW1lZE5vZGUpLl9fY2xhaW1lZCA9IHRydWU7XG4gIG5nRGV2TW9kZS5oeWRyYXRlZE5vZGVzKys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1JOb2RlQ2xhaW1lZEZvckh5ZHJhdGlvbihub2RlOiBSTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gISEobm9kZSBhcyBDbGFpbWVkTm9kZSkuX19jbGFpbWVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U2VnbWVudEhlYWQoXG4gICAgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIsIG5vZGU6IFJOb2RlfG51bGwpOiB2b2lkIHtcbiAgaHlkcmF0aW9uSW5mby5zZWdtZW50SGVhZHMgPz89IHt9O1xuICBoeWRyYXRpb25JbmZvLnNlZ21lbnRIZWFkc1tpbmRleF0gPSBub2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VnbWVudEhlYWQoaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIpOiBSTm9kZXxudWxsIHtcbiAgcmV0dXJuIGh5ZHJhdGlvbkluZm8uc2VnbWVudEhlYWRzPy5baW5kZXhdID8/IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc2l6ZSBvZiBhbiA8bmctY29udGFpbmVyPiwgdXNpbmcgZWl0aGVyIHRoZSBpbmZvcm1hdGlvblxuICogc2VyaWFsaXplZCBpbiBgRUxFTUVOVF9DT05UQUlORVJTYCAoZWxlbWVudCBjb250YWluZXIgc2l6ZSkgb3IgYnlcbiAqIGNvbXB1dGluZyB0aGUgc3VtIG9mIHJvb3Qgbm9kZXMgaW4gYWxsIGRlaHlkcmF0ZWQgdmlld3MgaW4gYSBnaXZlblxuICogY29udGFpbmVyIChpbiBjYXNlIHRoaXMgYDxuZy1jb250YWluZXI+YCB3YXMgYWxzbyB1c2VkIGFzIGEgdmlld1xuICogY29udGFpbmVyIGhvc3Qgbm9kZSwgZS5nLiA8bmctY29udGFpbmVyICpuZ0lmPikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ0NvbnRhaW5lclNpemUoaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGRhdGEgPSBoeWRyYXRpb25JbmZvLmRhdGE7XG4gIGxldCBzaXplID0gZGF0YVtFTEVNRU5UX0NPTlRBSU5FUlNdPy5baW5kZXhdID8/IG51bGw7XG4gIC8vIElmIHRoZXJlIGlzIG5vIHNlcmlhbGl6ZWQgaW5mb3JtYXRpb24gYXZhaWxhYmxlIGluIHRoZSBgRUxFTUVOVF9DT05UQUlORVJTYCBzbG90LFxuICAvLyBjaGVjayBpZiB3ZSBoYXZlIGluZm8gYWJvdXQgdmlldyBjb250YWluZXJzIGF0IHRoaXMgbG9jYXRpb24gKGUuZy5cbiAgLy8gYDxuZy1jb250YWluZXIgKm5nSWY+YCkgYW5kIHVzZSBjb250YWluZXIgc2l6ZSBhcyBhIG51bWJlciBvZiByb290IG5vZGVzIGluIHRoaXNcbiAgLy8gZWxlbWVudCBjb250YWluZXIuXG4gIGlmIChzaXplID09PSBudWxsICYmIGRhdGFbQ09OVEFJTkVSU10/LltpbmRleF0pIHtcbiAgICBzaXplID0gY2FsY1NlcmlhbGl6ZWRDb250YWluZXJTaXplKGh5ZHJhdGlvbkluZm8sIGluZGV4KTtcbiAgfVxuICByZXR1cm4gc2l6ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlcmlhbGl6ZWRDb250YWluZXJWaWV3cyhcbiAgICBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldywgaW5kZXg6IG51bWJlcik6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3W118bnVsbCB7XG4gIHJldHVybiBoeWRyYXRpb25JbmZvLmRhdGFbQ09OVEFJTkVSU10/LltpbmRleF0gPz8gbnVsbDtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgc2l6ZSBvZiBhIHNlcmlhbGl6ZWQgY29udGFpbmVyICh0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMpXG4gKiBieSBjYWxjdWxhdGluZyB0aGUgc3VtIG9mIHJvb3Qgbm9kZXMgaW4gYWxsIGRlaHlkcmF0ZWQgdmlld3MgaW4gdGhpcyBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjU2VyaWFsaXplZENvbnRhaW5lclNpemUoaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCB2aWV3cyA9IGdldFNlcmlhbGl6ZWRDb250YWluZXJWaWV3cyhoeWRyYXRpb25JbmZvLCBpbmRleCkgPz8gW107XG4gIGxldCBudW1Ob2RlcyA9IDA7XG4gIGZvciAobGV0IHZpZXcgb2Ygdmlld3MpIHtcbiAgICBudW1Ob2RlcyArPSB2aWV3W05VTV9ST09UX05PREVTXSAqICh2aWV3W01VTFRJUExJRVJdID8/IDEpO1xuICB9XG4gIHJldHVybiBudW1Ob2Rlcztcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIG5vZGUgaXMgYW5ub3RhdGVkIGFzIFwiZGlzY29ubmVjdGVkXCIsIGkuZS4gbm90IHByZXNlbnRcbiAqIGluIHRoZSBET00gYXQgc2VyaWFsaXphdGlvbiB0aW1lLiBXZSBzaG91bGQgbm90IGF0dGVtcHQgaHlkcmF0aW9uIGZvclxuICogc3VjaCBub2RlcyBhbmQgaW5zdGVhZCwgdXNlIGEgcmVndWxhciBcImNyZWF0aW9uIG1vZGVcIi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGlzY29ubmVjdGVkTm9kZShoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldywgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAvLyBDaGVjayBpZiB3ZSBhcmUgcHJvY2Vzc2luZyBkaXNjb25uZWN0ZWQgaW5mbyBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gIGlmICh0eXBlb2YgaHlkcmF0aW9uSW5mby5kaXNjb25uZWN0ZWROb2RlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zdCBub2RlSWRzID0gaHlkcmF0aW9uSW5mby5kYXRhW0RJU0NPTk5FQ1RFRF9OT0RFU107XG4gICAgaHlkcmF0aW9uSW5mby5kaXNjb25uZWN0ZWROb2RlcyA9IG5vZGVJZHMgPyAobmV3IFNldChub2RlSWRzKSkgOiBudWxsO1xuICB9XG4gIHJldHVybiAhIWh5ZHJhdGlvbkluZm8uZGlzY29ubmVjdGVkTm9kZXM/LmhhcyhpbmRleCk7XG59XG4iXX0=