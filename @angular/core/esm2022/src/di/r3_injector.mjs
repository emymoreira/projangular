/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { RuntimeError } from '../errors';
import { emitInstanceCreatedByInjectorEvent, emitProviderConfiguredEvent, runInInjectorProfilerContext, setInjectorProfilerContext } from '../render3/debug/injector_profiler';
import { getFactoryDef } from '../render3/definition_factory';
import { throwCyclicDependencyError, throwInvalidProviderError, throwMixedMultiProviderError } from '../render3/errors_di';
import { NG_ENV_ID } from '../render3/fields';
import { newArray } from '../util/array_utils';
import { EMPTY_ARRAY } from '../util/empty';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { ENVIRONMENT_INITIALIZER } from './initializer_token';
import { setInjectImplementation } from './inject_switch';
import { InjectionToken } from './injection_token';
import { catchInjectorError, convertToBitFlags, injectArgs, NG_TEMP_TOKEN_PATH, setCurrentInjector, THROW_IF_NOT_FOUND, ɵɵinject } from './injector_compatibility';
import { INJECTOR } from './injector_token';
import { getInheritedInjectableDef, getInjectableDef } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { isEnvironmentProviders } from './interface/provider';
import { INJECTOR_DEF_TYPES } from './internal_tokens';
import { NullInjector } from './null_injector';
import { isExistingProvider, isFactoryProvider, isTypeProvider, isValueProvider } from './provider_collection';
import { INJECTOR_SCOPE } from './scope';
/**
 * Marker which indicates that a value has not yet been created from the factory function.
 */
const NOT_YET = {};
/**
 * Marker which indicates that the factory function for a token is in the process of being called.
 *
 * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
 * injection of a dependency has recursively attempted to inject the original token, and there is
 * a circular dependency among the providers.
 */
const CIRCULAR = {};
/**
 * A lazily initialized NullInjector.
 */
let NULL_INJECTOR = undefined;
export function getNullInjector() {
    if (NULL_INJECTOR === undefined) {
        NULL_INJECTOR = new NullInjector();
    }
    return NULL_INJECTOR;
}
/**
 * An `Injector` that's part of the environment injector hierarchy, which exists outside of the
 * component tree.
 */
export class EnvironmentInjector {
}
export class R3Injector extends EnvironmentInjector {
    /**
     * Flag indicating that this injector was previously destroyed.
     */
    get destroyed() {
        return this._destroyed;
    }
    constructor(providers, parent, source, scopes) {
        super();
        this.parent = parent;
        this.source = source;
        this.scopes = scopes;
        /**
         * Map of tokens to records which contain the instances of those tokens.
         * - `null` value implies that we don't have the record. Used by tree-shakable injectors
         * to prevent further searches.
         */
        this.records = new Map();
        /**
         * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
         */
        this._ngOnDestroyHooks = new Set();
        this._onDestroyHooks = [];
        this._destroyed = false;
        // Start off by creating Records for every provider.
        forEachSingleProvider(providers, provider => this.processProvider(provider));
        // Make sure the INJECTOR token provides this injector.
        this.records.set(INJECTOR, makeRecord(undefined, this));
        // And `EnvironmentInjector` if the current injector is supposed to be env-scoped.
        if (scopes.has('environment')) {
            this.records.set(EnvironmentInjector, makeRecord(undefined, this));
        }
        // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
        // any injectable scoped to APP_ROOT_SCOPE.
        const record = this.records.get(INJECTOR_SCOPE);
        if (record != null && typeof record.value === 'string') {
            this.scopes.add(record.value);
        }
        this.injectorDefTypes =
            new Set(this.get(INJECTOR_DEF_TYPES.multi, EMPTY_ARRAY, InjectFlags.Self));
    }
    /**
     * Destroy the injector and release references to every instance or provider associated with it.
     *
     * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
     * hook was found.
     */
    destroy() {
        this.assertNotDestroyed();
        // Set destroyed = true first, in case lifecycle hooks re-enter destroy().
        this._destroyed = true;
        try {
            // Call all the lifecycle hooks.
            for (const service of this._ngOnDestroyHooks) {
                service.ngOnDestroy();
            }
            const onDestroyHooks = this._onDestroyHooks;
            // Reset the _onDestroyHooks array before iterating over it to prevent hooks that unregister
            // themselves from mutating the array during iteration.
            this._onDestroyHooks = [];
            for (const hook of onDestroyHooks) {
                hook();
            }
        }
        finally {
            // Release all references.
            this.records.clear();
            this._ngOnDestroyHooks.clear();
            this.injectorDefTypes.clear();
        }
    }
    onDestroy(callback) {
        this.assertNotDestroyed();
        this._onDestroyHooks.push(callback);
        return () => this.removeOnDestroy(callback);
    }
    runInContext(fn) {
        this.assertNotDestroyed();
        const previousInjector = setCurrentInjector(this);
        const previousInjectImplementation = setInjectImplementation(undefined);
        let prevInjectContext;
        if (ngDevMode) {
            prevInjectContext = setInjectorProfilerContext({ injector: this, token: null });
        }
        try {
            return fn();
        }
        finally {
            setCurrentInjector(previousInjector);
            setInjectImplementation(previousInjectImplementation);
            ngDevMode && setInjectorProfilerContext(prevInjectContext);
        }
    }
    get(token, notFoundValue = THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        this.assertNotDestroyed();
        if (token.hasOwnProperty(NG_ENV_ID)) {
            return token[NG_ENV_ID](this);
        }
        flags = convertToBitFlags(flags);
        // Set the injection context.
        let prevInjectContext;
        if (ngDevMode) {
            prevInjectContext = setInjectorProfilerContext({ injector: this, token: token });
        }
        const previousInjector = setCurrentInjector(this);
        const previousInjectImplementation = setInjectImplementation(undefined);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & InjectFlags.SkipSelf)) {
                // SkipSelf isn't set, check if the record belongs to this injector.
                let record = this.records.get(token);
                if (record === undefined) {
                    // No record, but maybe the token is scoped to this injector. Look for an injectable
                    // def with a scope matching this injector.
                    const def = couldBeInjectableType(token) && getInjectableDef(token);
                    if (def && this.injectableDefInScope(def)) {
                        // Found an injectable def and it's scoped to this injector. Pretend as if it was here
                        // all along.
                        record = makeRecord(injectableDefOrInjectorDefFactory(token), NOT_YET);
                    }
                    else {
                        record = null;
                    }
                    this.records.set(token, record);
                }
                // If a record was found, get the instance for it and return it.
                if (record != null /* NOT null || undefined */) {
                    return this.hydrate(token, record);
                }
            }
            // Select the next injector based on the Self flag - if self is set, the next injector is
            // the NullInjector, otherwise it's the parent.
            const nextInjector = !(flags & InjectFlags.Self) ? this.parent : getNullInjector();
            // Set the notFoundValue based on the Optional flag - if optional is set and notFoundValue
            // is undefined, the value is null, otherwise it's the notFoundValue.
            notFoundValue = (flags & InjectFlags.Optional) && notFoundValue === THROW_IF_NOT_FOUND ?
                null :
                notFoundValue;
            return nextInjector.get(token, notFoundValue);
        }
        catch (e) {
            if (e.name === 'NullInjectorError') {
                const path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
                path.unshift(stringify(token));
                if (previousInjector) {
                    // We still have a parent injector, keep throwing
                    throw e;
                }
                else {
                    // Format & throw the final error message when we don't have any previous injector
                    return catchInjectorError(e, token, 'R3InjectorError', this.source);
                }
            }
            else {
                throw e;
            }
        }
        finally {
            // Lastly, restore the previous injection context.
            setInjectImplementation(previousInjectImplementation);
            setCurrentInjector(previousInjector);
            ngDevMode && setInjectorProfilerContext(prevInjectContext);
        }
    }
    /** @internal */
    resolveInjectorInitializers() {
        const previousInjector = setCurrentInjector(this);
        const previousInjectImplementation = setInjectImplementation(undefined);
        let prevInjectContext;
        if (ngDevMode) {
            prevInjectContext = setInjectorProfilerContext({ injector: this, token: null });
        }
        try {
            const initializers = this.get(ENVIRONMENT_INITIALIZER.multi, EMPTY_ARRAY, InjectFlags.Self);
            if (ngDevMode && !Array.isArray(initializers)) {
                throw new RuntimeError(-209 /* RuntimeErrorCode.INVALID_MULTI_PROVIDER */, 'Unexpected type of the `ENVIRONMENT_INITIALIZER` token value ' +
                    `(expected an array, but got ${typeof initializers}). ` +
                    'Please check that the `ENVIRONMENT_INITIALIZER` token is configured as a ' +
                    '`multi: true` provider.');
            }
            for (const initializer of initializers) {
                initializer();
            }
        }
        finally {
            setCurrentInjector(previousInjector);
            setInjectImplementation(previousInjectImplementation);
            ngDevMode && setInjectorProfilerContext(prevInjectContext);
        }
    }
    toString() {
        const tokens = [];
        const records = this.records;
        for (const token of records.keys()) {
            tokens.push(stringify(token));
        }
        return `R3Injector[${tokens.join(', ')}]`;
    }
    assertNotDestroyed() {
        if (this._destroyed) {
            throw new RuntimeError(205 /* RuntimeErrorCode.INJECTOR_ALREADY_DESTROYED */, ngDevMode && 'Injector has already been destroyed.');
        }
    }
    /**
     * Process a `SingleProvider` and add it.
     */
    processProvider(provider) {
        // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
        // property.
        provider = resolveForwardRef(provider);
        let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider && provider.provide);
        // Construct a `Record` for the provider.
        const record = providerToRecord(provider);
        if (ngDevMode) {
            runInInjectorProfilerContext(this, token, () => {
                // Emit InjectorProfilerEventType.Create if provider is a value provider because
                // these are the only providers that do not go through the value hydration logic
                // where this event would normally be emitted from.
                if (isValueProvider(provider)) {
                    emitInstanceCreatedByInjectorEvent(provider.useValue);
                }
                emitProviderConfiguredEvent(provider);
            });
        }
        if (!isTypeProvider(provider) && provider.multi === true) {
            // If the provider indicates that it's a multi-provider, process it specially.
            // First check whether it's been defined already.
            let multiRecord = this.records.get(token);
            if (multiRecord) {
                // It has. Throw a nice error if
                if (ngDevMode && multiRecord.multi === undefined) {
                    throwMixedMultiProviderError();
                }
            }
            else {
                multiRecord = makeRecord(undefined, NOT_YET, true);
                multiRecord.factory = () => injectArgs(multiRecord.multi);
                this.records.set(token, multiRecord);
            }
            token = provider;
            multiRecord.multi.push(provider);
        }
        else {
            const existing = this.records.get(token);
            if (ngDevMode && existing && existing.multi !== undefined) {
                throwMixedMultiProviderError();
            }
        }
        this.records.set(token, record);
    }
    hydrate(token, record) {
        if (ngDevMode && record.value === CIRCULAR) {
            throwCyclicDependencyError(stringify(token));
        }
        else if (record.value === NOT_YET) {
            record.value = CIRCULAR;
            if (ngDevMode) {
                runInInjectorProfilerContext(this, token, () => {
                    record.value = record.factory();
                    emitInstanceCreatedByInjectorEvent(record.value);
                });
            }
            else {
                record.value = record.factory();
            }
        }
        if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
            this._ngOnDestroyHooks.add(record.value);
        }
        return record.value;
    }
    injectableDefInScope(def) {
        if (!def.providedIn) {
            return false;
        }
        const providedIn = resolveForwardRef(def.providedIn);
        if (typeof providedIn === 'string') {
            return providedIn === 'any' || (this.scopes.has(providedIn));
        }
        else {
            return this.injectorDefTypes.has(providedIn);
        }
    }
    removeOnDestroy(callback) {
        const destroyCBIdx = this._onDestroyHooks.indexOf(callback);
        if (destroyCBIdx !== -1) {
            this._onDestroyHooks.splice(destroyCBIdx, 1);
        }
    }
}
function injectableDefOrInjectorDefFactory(token) {
    // Most tokens will have an injectable def directly on them, which specifies a factory directly.
    const injectableDef = getInjectableDef(token);
    const factory = injectableDef !== null ? injectableDef.factory : getFactoryDef(token);
    if (factory !== null) {
        return factory;
    }
    // InjectionTokens should have an injectable def (ɵprov) and thus should be handled above.
    // If it's missing that, it's an error.
    if (token instanceof InjectionToken) {
        throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode && `Token ${stringify(token)} is missing a ɵprov definition.`);
    }
    // Undecorated types can sometimes be created if they have no constructor arguments.
    if (token instanceof Function) {
        return getUndecoratedInjectableFactory(token);
    }
    // There was no way to resolve a factory for this token.
    throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode && 'unreachable');
}
function getUndecoratedInjectableFactory(token) {
    // If the token has parameters then it has dependencies that we cannot resolve implicitly.
    const paramLength = token.length;
    if (paramLength > 0) {
        const args = newArray(paramLength, '?');
        throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode && `Can't resolve all parameters for ${stringify(token)}: (${args.join(', ')}).`);
    }
    // The constructor function appears to have no parameters.
    // This might be because it inherits from a super-class. In which case, use an injectable
    // def from an ancestor if there is one.
    // Otherwise this really is a simple class with no dependencies, so return a factory that
    // just instantiates the zero-arg constructor.
    const inheritedInjectableDef = getInheritedInjectableDef(token);
    if (inheritedInjectableDef !== null) {
        return () => inheritedInjectableDef.factory(token);
    }
    else {
        return () => new token();
    }
}
function providerToRecord(provider) {
    if (isValueProvider(provider)) {
        return makeRecord(undefined, provider.useValue);
    }
    else {
        const factory = providerToFactory(provider);
        return makeRecord(factory, NOT_YET);
    }
}
/**
 * Converts a `SingleProvider` into a factory function.
 *
 * @param provider provider to convert to factory
 */
export function providerToFactory(provider, ngModuleType, providers) {
    let factory = undefined;
    if (ngDevMode && isEnvironmentProviders(provider)) {
        throwInvalidProviderError(undefined, providers, provider);
    }
    if (isTypeProvider(provider)) {
        const unwrappedProvider = resolveForwardRef(provider);
        return getFactoryDef(unwrappedProvider) || injectableDefOrInjectorDefFactory(unwrappedProvider);
    }
    else {
        if (isValueProvider(provider)) {
            factory = () => resolveForwardRef(provider.useValue);
        }
        else if (isFactoryProvider(provider)) {
            factory = () => provider.useFactory(...injectArgs(provider.deps || []));
        }
        else if (isExistingProvider(provider)) {
            factory = () => ɵɵinject(resolveForwardRef(provider.useExisting));
        }
        else {
            const classRef = resolveForwardRef(provider &&
                (provider.useClass || provider.provide));
            if (ngDevMode && !classRef) {
                throwInvalidProviderError(ngModuleType, providers, provider);
            }
            if (hasDeps(provider)) {
                factory = () => new (classRef)(...injectArgs(provider.deps));
            }
            else {
                return getFactoryDef(classRef) || injectableDefOrInjectorDefFactory(classRef);
            }
        }
    }
    return factory;
}
function makeRecord(factory, value, multi = false) {
    return {
        factory: factory,
        value: value,
        multi: multi ? [] : undefined,
    };
}
function hasDeps(value) {
    return !!value.deps;
}
function hasOnDestroy(value) {
    return value !== null && typeof value === 'object' &&
        typeof value.ngOnDestroy === 'function';
}
function couldBeInjectableType(value) {
    return (typeof value === 'function') ||
        (typeof value === 'object' && value instanceof InjectionToken);
}
function forEachSingleProvider(providers, fn) {
    for (const provider of providers) {
        if (Array.isArray(provider)) {
            forEachSingleProvider(provider, fn);
        }
        else if (provider && isEnvironmentProviders(provider)) {
            forEachSingleProvider(provider.ɵproviders, fn);
        }
        else {
            fn(provider);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLHFCQUFxQixDQUFDO0FBRTdCLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBR3pELE9BQU8sRUFBQyxrQ0FBa0MsRUFBRSwyQkFBMkIsRUFBMkIsNEJBQTRCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxvQ0FBb0MsQ0FBQztBQUN0TSxPQUFPLEVBQVksYUFBYSxFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDdkUsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHlCQUF5QixFQUFFLDRCQUE0QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDekgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDNUQsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDeEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDakssT0FBTyxFQUFDLFFBQVEs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T0FBTyxLQUFLLEtBQUssUUFBUTtRQUM5QyxPQUFRLEtBQW1CLENBQUMsV0FBVyxLQUFLLFVBQVUsQ0FBQztBQUM3RCxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVO0lBQ3ZDLE9BQU8sQ0FBQyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7UUFDaEMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxZQUFZLGNBQWMsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUMxQixTQUErQyxFQUFFLEVBQXNDO0lBQ3pGLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO1FBQ2hDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMzQixxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDckM7YUFBTSxJQUFJLFFBQVEsSUFBSSxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN2RCxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2hEO2FBQU07WUFDTCxFQUFFLENBQUMsUUFBMEIsQ0FBQyxDQUFDO1NBQ2hDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2VtaXRJbnN0YW5jZUNyZWF0ZWRCeUluamVjdG9yRXZlbnQsIGVtaXRQcm92aWRlckNvbmZpZ3VyZWRFdmVudCwgSW5qZWN0b3JQcm9maWxlckNvbnRleHQsIHJ1bkluSW5qZWN0b3JQcm9maWxlckNvbnRleHQsIHNldEluamVjdG9yUHJvZmlsZXJDb250ZXh0fSBmcm9tICcuLi9yZW5kZXIzL2RlYnVnL2luamVjdG9yX3Byb2ZpbGVyJztcbmltcG9ydCB7RmFjdG9yeUZuLCBnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb25fZmFjdG9yeSc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0ludmFsaWRQcm92aWRlckVycm9yLCB0aHJvd01peGVkTXVsdGlQcm92aWRlckVycm9yfSBmcm9tICcuLi9yZW5kZXIzL2Vycm9yc19kaSc7XG5pbXBvcnQge05HX0VOVl9JRH0gZnJvbSAnLi4vcmVuZGVyMy9maWVsZHMnO1xuaW1wb3J0IHtuZXdBcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi91dGlsL2VtcHR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUn0gZnJvbSAnLi9pbml0aWFsaXplcl90b2tlbic7XG5pbXBvcnQge3NldEluamVjdEltcGxlbWVudGF0aW9ufSBmcm9tICcuL2luamVjdF9zd2l0Y2gnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge2NhdGNoSW5qZWN0b3JFcnJvciwgY29udmVydFRvQml0RmxhZ3MsIGluamVjdEFyZ3MsIE5HX1RFTVBfVE9LRU5fUEFUSCwgc2V0Q3VycmVudEluamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkQsIMm1ybVpbmplY3R9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0lOSkVDVE9SfSBmcm9tICcuL2luamVjdG9yX3Rva2VuJztcbmltcG9ydCB7Z2V0SW5oZXJpdGVkSW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0YWJsZURlZiwgSW5qZWN0b3JUeXBlLCDJtcm1SW5qZWN0YWJsZURlY2xhcmF0aW9ufSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdE9wdGlvbnN9IGZyb20gJy4vaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgQ29uc3RydWN0b3JQcm92aWRlciwgRW52aXJvbm1lbnRQcm92aWRlcnMsIEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnMsIGlzRW52aXJvbm1lbnRQcm92aWRlcnMsIFByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0lOSkVDVE9SX0RFRl9UWVBFU30gZnJvbSAnLi9pbnRlcm5hbF90b2tlbnMnO1xuaW1wb3J0IHtOdWxsSW5qZWN0b3J9IGZyb20gJy4vbnVsbF9pbmplY3Rvcic7XG5pbXBvcnQge2lzRXhpc3RpbmdQcm92aWRlciwgaXNGYWN0b3J5UHJvdmlkZXIsIGlzVHlwZVByb3ZpZGVyLCBpc1ZhbHVlUHJvdmlkZXIsIFNpbmdsZVByb3ZpZGVyfSBmcm9tICcuL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtQcm92aWRlclRva2VufSBmcm9tICcuL3Byb3ZpZGVyX3Rva2VuJztcbmltcG9ydCB7SU5KRUNUT1JfU0NPUEUsIEluamVjdG9yU2NvcGV9IGZyb20gJy4vc2NvcGUnO1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCBmcm9tIHRoZSBmYWN0b3J5IGZ1bmN0aW9uLlxuICovXG5jb25zdCBOT1RfWUVUID0ge307XG5cbi8qKlxuICogTWFya2VyIHdoaWNoIGluZGljYXRlcyB0aGF0IHRoZSBmYWN0b3J5IGZ1bmN0aW9uIGZvciBhIHRva2VuIGlzIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGNhbGxlZC5cbiAqXG4gKiBJZiB0aGUgaW5qZWN0b3IgaXMgYXNrZWQgdG8gaW5qZWN0IGEgdG9rZW4gd2l0aCBpdHMgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB0aGF0IGluZGljYXRlc1xuICogaW5qZWN0aW9uIG9mIGEgZGVwZW5kZW5jeSBoYXMgcmVjdXJzaXZlbHkgYXR0ZW1wdGVkIHRvIGluamVjdCB0aGUgb3JpZ2luYWwgdG9rZW4sIGFuZCB0aGVyZSBpc1xuICogYSBjaXJjdWxhciBkZXBlbmRlbmN5IGFtb25nIHRoZSBwcm92aWRlcnMuXG4gKi9cbmNvbnN0IENJUkNVTEFSID0ge307XG5cbi8qKlxuICogQSBsYXppbHkgaW5pdGlhbGl6ZWQgTnVsbEluamVjdG9yLlxuICovXG5sZXQgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3J8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TnVsbEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgaWYgKE5VTExfSU5KRUNUT1IgPT09IHVuZGVmaW5lZCkge1xuICAgIE5VTExfSU5KRUNUT1IgPSBuZXcgTnVsbEluamVjdG9yKCk7XG4gIH1cbiAgcmV0dXJuIE5VTExfSU5KRUNUT1I7XG59XG5cbi8qKlxuICogQW4gZW50cnkgaW4gdGhlIGluamVjdG9yIHdoaWNoIHRyYWNrcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZ2l2ZW4gdG9rZW4sIGluY2x1ZGluZyBhIHBvc3NpYmxlXG4gKiBjdXJyZW50IHZhbHVlLlxuICovXG5pbnRlcmZhY2UgUmVjb3JkPFQ+IHtcbiAgZmFjdG9yeTogKCgpID0+IFQpfHVuZGVmaW5lZDtcbiAgdmFsdWU6IFR8e307XG4gIG11bHRpOiBhbnlbXXx1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQW4gYEluamVjdG9yYCB0aGF0J3MgcGFydCBvZiB0aGUgZW52aXJvbm1lbnQgaW5qZWN0b3IgaGllcmFyY2h5LCB3aGljaCBleGlzdHMgb3V0c2lkZSBvZiB0aGVcbiAqIGNvbXBvbmVudCB0cmVlLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRW52aXJvbm1lbnRJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbiBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgdG9rZW4uXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIGBub3RGb3VuZFZhbHVlYC5cbiAgICogQHRocm93cyBXaGVuIHRoZSBgbm90Rm91bmRWYWx1ZWAgaXMgYHVuZGVmaW5lZGAgb3IgYEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORGAuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IHVuZGVmaW5lZCwgb3B0aW9uczogSW5qZWN0T3B0aW9ucyZ7XG4gICAgb3B0aW9uYWw/OiBmYWxzZTtcbiAgfSk6IFQ7XG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsfHVuZGVmaW5lZCwgb3B0aW9uczogSW5qZWN0T3B0aW9ucyk6IFRcbiAgICAgIHxudWxsO1xuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGJhc2VkIG9uIHRoZSBwcm92aWRlZCB0b2tlbi5cbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGlmIGRlZmluZWQsIG90aGVyd2lzZSB0aGUgYG5vdEZvdW5kVmFsdWVgLlxuICAgKiBAdGhyb3dzIFdoZW4gdGhlIGBub3RGb3VuZFZhbHVlYCBpcyBgdW5kZWZpbmVkYCBvciBgSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EYC5cbiAgICovXG4gIGFic3RyYWN0IGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVDtcbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbiBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgdG9rZW4uXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIGBub3RGb3VuZFZhbHVlYC5cbiAgICogQHRocm93cyBXaGVuIHRoZSBgbm90Rm91bmRWYWx1ZWAgaXMgYHVuZGVmaW5lZGAgb3IgYEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORGAuXG4gICAqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC5cbiAgICovXG4gIGFic3RyYWN0IGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2NC4wLjAgdXNlIFByb3ZpZGVyVG9rZW48VD5cbiAgICogQHN1cHByZXNzIHtkdXBsaWNhdGV9XG4gICAqL1xuICBhYnN0cmFjdCBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcblxuICAvKipcbiAgICogUnVucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gaW4gdGhlIGNvbnRleHQgb2YgdGhpcyBgRW52aXJvbm1lbnRJbmplY3RvcmAuXG4gICAqXG4gICAqIFdpdGhpbiB0aGUgZnVuY3Rpb24ncyBzdGFjayBmcmFtZSwgW2BpbmplY3RgXShhcGkvY29yZS9pbmplY3QpIGNhbiBiZSB1c2VkIHRvIGluamVjdFxuICAgKiBkZXBlbmRlbmNpZXMgZnJvbSB0aGlzIGluamVjdG9yLiBOb3RlIHRoYXQgYGluamVjdGAgaXMgb25seSB1c2FibGUgc3luY2hyb25vdXNseSwgYW5kIGNhbm5vdCBiZVxuICAgKiB1c2VkIGluIGFueSBhc3luY2hyb25vdXMgY2FsbGJhY2tzIG9yIGFmdGVyIGFueSBgYXdhaXRgIHBvaW50cy5cbiAgICpcbiAgICogQHBhcmFtIGZuIHRoZSBjbG9zdXJlIHRvIGJlIHJ1biBpbiB0aGUgY29udGV4dCBvZiB0aGlzIGluamVjdG9yXG4gICAqIEByZXR1cm5zIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uLCBpZiBhbnlcbiAgICogQGRlcHJlY2F0ZWQgdXNlIHRoZSBzdGFuZGFsb25lIGZ1bmN0aW9uIGBydW5JbkluamVjdGlvbkNvbnRleHRgIGluc3RlYWRcbiAgICovXG4gIGFic3RyYWN0IHJ1bkluQ29udGV4dDxSZXR1cm5UPihmbjogKCkgPT4gUmV0dXJuVCk6IFJldHVyblQ7XG5cbiAgYWJzdHJhY3QgZGVzdHJveSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFic3RyYWN0IG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBSM0luamVjdG9yIGV4dGVuZHMgRW52aXJvbm1lbnRJbmplY3RvciB7XG4gIC8qKlxuICAgKiBNYXAgb2YgdG9rZW5zIHRvIHJlY29yZHMgd2hpY2ggY29udGFpbiB0aGUgaW5zdGFuY2VzIG9mIHRob3NlIHRva2Vucy5cbiAgICogLSBgbnVsbGAgdmFsdWUgaW1wbGllcyB0aGF0IHdlIGRvbid0IGhhdmUgdGhlIHJlY29yZC4gVXNlZCBieSB0cmVlLXNoYWthYmxlIGluamVjdG9yc1xuICAgKiB0byBwcmV2ZW50IGZ1cnRoZXIgc2VhcmNoZXMuXG4gICAqL1xuICBwcml2YXRlIHJlY29yZHMgPSBuZXcgTWFwPFByb3ZpZGVyVG9rZW48YW55PiwgUmVjb3JkPGFueT58bnVsbD4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIHZhbHVlcyBpbnN0YW50aWF0ZWQgYnkgdGhpcyBpbmplY3RvciB3aGljaCBjb250YWluIGBuZ09uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzLlxuICAgKi9cbiAgcHJpdmF0ZSBfbmdPbkRlc3Ryb3lIb29rcyA9IG5ldyBTZXQ8T25EZXN0cm95PigpO1xuXG4gIHByaXZhdGUgX29uRGVzdHJveUhvb2tzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGlzIGluamVjdG9yIHdhcyBwcmV2aW91c2x5IGRlc3Ryb3llZC5cbiAgICovXG4gIGdldCBkZXN0cm95ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rlc3Ryb3llZDtcbiAgfVxuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIGluamVjdG9yRGVmVHlwZXM6IFNldDxUeXBlPHVua25vd24+PjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXJ8RW52aXJvbm1lbnRQcm92aWRlcnM+LCByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yLFxuICAgICAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbCwgcmVhZG9ubHkgc2NvcGVzOiBTZXQ8SW5qZWN0b3JTY29wZT4pIHtcbiAgICBzdXBlcigpO1xuICAgIC8vIFN0YXJ0IG9mZiBieSBjcmVhdGluZyBSZWNvcmRzIGZvciBldmVyeSBwcm92aWRlci5cbiAgICBmb3JFYWNoU2luZ2xlUHJvdmlkZXIoXG4gICAgICAgIHByb3ZpZGVycyBhcyBBcnJheTxQcm92aWRlcnxJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgICAgICAgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIpKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgSU5KRUNUT1IgdG9rZW4gcHJvdmlkZXMgdGhpcyBpbmplY3Rvci5cbiAgICB0aGlzLnJlY29yZHMuc2V0KElOSkVDVE9SLCBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgdGhpcykpO1xuXG4gICAgLy8gQW5kIGBFbnZpcm9ubWVudEluamVjdG9yYCBpZiB0aGUgY3VycmVudCBpbmplY3RvciBpcyBzdXBwb3NlZCB0byBiZSBlbnYtc2NvcGVkLlxuICAgIGlmIChzY29wZXMuaGFzKCdlbnZpcm9ubWVudCcpKSB7XG4gICAgICB0aGlzLnJlY29yZHMuc2V0KEVudmlyb25tZW50SW5qZWN0b3IsIG1ha2VSZWNvcmQodW5kZWZpbmVkLCB0aGlzKSk7XG4gICAgfVxuXG4gICAgLy8gRGV0ZWN0IHdoZXRoZXIgdGhpcyBpbmplY3RvciBoYXMgdGhlIEFQUF9ST09UX1NDT1BFIHRva2VuIGFuZCB0aHVzIHNob3VsZCBwcm92aWRlXG4gICAgLy8gYW55IGluamVjdGFibGUgc2NvcGVkIHRvIEFQUF9ST09UX1NDT1BFLlxuICAgIGNvbnN0IHJlY29yZCA9IHRoaXMucmVjb3Jkcy5nZXQoSU5KRUNUT1JfU0NPUEUpIGFzIFJlY29yZDxJbmplY3RvclNjb3BlfG51bGw+O1xuICAgIGlmIChyZWNvcmQgIT0gbnVsbCAmJiB0eXBlb2YgcmVjb3JkLnZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5zY29wZXMuYWRkKHJlY29yZC52YWx1ZSBhcyBJbmplY3RvclNjb3BlKTtcbiAgICB9XG5cbiAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMgPVxuICAgICAgICBuZXcgU2V0KHRoaXMuZ2V0KElOSkVDVE9SX0RFRl9UWVBFUy5tdWx0aSwgRU1QVFlfQVJSQVksIEluamVjdEZsYWdzLlNlbGYpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95IHRoZSBpbmplY3RvciBhbmQgcmVsZWFzZSByZWZlcmVuY2VzIHRvIGV2ZXJ5IGluc3RhbmNlIG9yIHByb3ZpZGVyIGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAgICpcbiAgICogQWxzbyBjYWxscyB0aGUgYE9uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzIG9mIGV2ZXJ5IGluc3RhbmNlIHRoYXQgd2FzIGNyZWF0ZWQgZm9yIHdoaWNoIGFcbiAgICogaG9vayB3YXMgZm91bmQuXG4gICAqL1xuICBvdmVycmlkZSBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG5cbiAgICAvLyBTZXQgZGVzdHJveWVkID0gdHJ1ZSBmaXJzdCwgaW4gY2FzZSBsaWZlY3ljbGUgaG9va3MgcmUtZW50ZXIgZGVzdHJveSgpLlxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICBmb3IgKGNvbnN0IHNlcnZpY2Ugb2YgdGhpcy5fbmdPbkRlc3Ryb3lIb29rcykge1xuICAgICAgICBzZXJ2aWNlLm5nT25EZXN0cm95KCk7XG4gICAgICB9XG4gICAgICBjb25zdCBvbkRlc3Ryb3lIb29rcyA9IHRoaXMuX29uRGVzdHJveUhvb2tzO1xuICAgICAgLy8gUmVzZXQgdGhlIF9vbkRlc3Ryb3lIb29rcyBhcnJheSBiZWZvcmUgaXRlcmF0aW5nIG92ZXIgaXQgdG8gcHJldmVudCBob29rcyB0aGF0IHVucmVnaXN0ZXJcbiAgICAgIC8vIHRoZW1zZWx2ZXMgZnJvbSBtdXRhdGluZyB0aGUgYXJyYXkgZHVyaW5nIGl0ZXJhdGlvbi5cbiAgICAgIHRoaXMuX29uRGVzdHJveUhvb2tzID0gW107XG4gICAgICBmb3IgKGNvbnN0IGhvb2sgb2Ygb25EZXN0cm95SG9va3MpIHtcbiAgICAgICAgaG9vaygpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBSZWxlYXNlIGFsbCByZWZlcmVuY2VzLlxuICAgICAgdGhpcy5yZWNvcmRzLmNsZWFyKCk7XG4gICAgICB0aGlzLl9uZ09uRGVzdHJveUhvb2tzLmNsZWFyKCk7XG4gICAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuICAgIHRoaXMuX29uRGVzdHJveUhvb2tzLnB1c2goY2FsbGJhY2spO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLnJlbW92ZU9uRGVzdHJveShjYWxsYmFjayk7XG4gIH1cblxuICBvdmVycmlkZSBydW5JbkNvbnRleHQ8UmV0dXJuVD4oZm46ICgpID0+IFJldHVyblQpOiBSZXR1cm5UIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuXG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcih0aGlzKTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcblxuICAgIGxldCBwcmV2SW5qZWN0Q29udGV4dDogSW5qZWN0b3JQcm9maWxlckNvbnRleHR8dW5kZWZpbmVkO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHByZXZJbmplY3RDb250ZXh0ID0gc2V0SW5qZWN0b3JQcm9maWxlckNvbnRleHQoe2luamVjdG9yOiB0aGlzLCB0b2tlbjogbnVsbH0pO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZm4oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgICAgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgICBuZ0Rldk1vZGUgJiYgc2V0SW5qZWN0b3JQcm9maWxlckNvbnRleHQocHJldkluamVjdENvbnRleHQhKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXQ8VD4oXG4gICAgICB0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3M6IEluamVjdEZsYWdzfEluamVjdE9wdGlvbnMgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcblxuICAgIGlmICh0b2tlbi5oYXNPd25Qcm9wZXJ0eShOR19FTlZfSUQpKSB7XG4gICAgICByZXR1cm4gKHRva2VuIGFzIGFueSlbTkdfRU5WX0lEXSh0aGlzKTtcbiAgICB9XG5cbiAgICBmbGFncyA9IGNvbnZlcnRUb0JpdEZsYWdzKGZsYWdzKSBhcyBJbmplY3RGbGFncztcblxuICAgIC8vIFNldCB0aGUgaW5qZWN0aW9uIGNvbnRleHQuXG4gICAgbGV0IHByZXZJbmplY3RDb250ZXh0OiBJbmplY3RvclByb2ZpbGVyQ29udGV4dDtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBwcmV2SW5qZWN0Q29udGV4dCA9IHNldEluamVjdG9yUHJvZmlsZXJDb250ZXh0KHtpbmplY3RvcjogdGhpcywgdG9rZW46IHRva2VuIGFzIFR5cGU8VD59KTtcbiAgICB9XG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcih0aGlzKTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgZm9yIHRoZSBTa2lwU2VsZiBmbGFnLlxuICAgICAgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikpIHtcbiAgICAgICAgLy8gU2tpcFNlbGYgaXNuJ3Qgc2V0LCBjaGVjayBpZiB0aGUgcmVjb3JkIGJlbG9uZ3MgdG8gdGhpcyBpbmplY3Rvci5cbiAgICAgICAgbGV0IHJlY29yZDogUmVjb3JkPFQ+fHVuZGVmaW5lZHxudWxsID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICAgIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIE5vIHJlY29yZCwgYnV0IG1heWJlIHRoZSB0b2tlbiBpcyBzY29wZWQgdG8gdGhpcyBpbmplY3Rvci4gTG9vayBmb3IgYW4gaW5qZWN0YWJsZVxuICAgICAgICAgIC8vIGRlZiB3aXRoIGEgc2NvcGUgbWF0Y2hpbmcgdGhpcyBpbmplY3Rvci5cbiAgICAgICAgICBjb25zdCBkZWYgPSBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodG9rZW4pICYmIGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICAgICAgICAgIGlmIChkZWYgJiYgdGhpcy5pbmplY3RhYmxlRGVmSW5TY29wZShkZWYpKSB7XG4gICAgICAgICAgICAvLyBGb3VuZCBhbiBpbmplY3RhYmxlIGRlZiBhbmQgaXQncyBzY29wZWQgdG8gdGhpcyBpbmplY3Rvci4gUHJldGVuZCBhcyBpZiBpdCB3YXMgaGVyZVxuICAgICAgICAgICAgLy8gYWxsIGFsb25nLlxuICAgICAgICAgICAgcmVjb3JkID0gbWFrZVJlY29yZChpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodG9rZW4pLCBOT1RfWUVUKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVjb3JkID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWNvcmRzLnNldCh0b2tlbiwgcmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBhIHJlY29yZCB3YXMgZm91bmQsIGdldCB0aGUgaW5zdGFuY2UgZm9yIGl0IGFuZCByZXR1cm4gaXQuXG4gICAgICAgIGlmIChyZWNvcmQgIT0gbnVsbCAvKiBOT1QgbnVsbCB8fCB1bmRlZmluZWQgKi8pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oeWRyYXRlKHRva2VuLCByZWNvcmQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbGVjdCB0aGUgbmV4dCBpbmplY3RvciBiYXNlZCBvbiB0aGUgU2VsZiBmbGFnIC0gaWYgc2VsZiBpcyBzZXQsIHRoZSBuZXh0IGluamVjdG9yIGlzXG4gICAgICAvLyB0aGUgTnVsbEluamVjdG9yLCBvdGhlcndpc2UgaXQncyB0aGUgcGFyZW50LlxuICAgICAgY29uc3QgbmV4dEluamVjdG9yID0gIShmbGFncyAmIEluamVjdEZsYWdzLlNlbGYpID8gdGhpcy5wYXJlbnQgOiBnZXROdWxsSW5qZWN0b3IoKTtcbiAgICAgIC8vIFNldCB0aGUgbm90Rm91bmRWYWx1ZSBiYXNlZCBvbiB0aGUgT3B0aW9uYWwgZmxhZyAtIGlmIG9wdGlvbmFsIGlzIHNldCBhbmQgbm90Rm91bmRWYWx1ZVxuICAgICAgLy8gaXMgdW5kZWZpbmVkLCB0aGUgdmFsdWUgaXMgbnVsbCwgb3RoZXJ3aXNlIGl0J3MgdGhlIG5vdEZvdW5kVmFsdWUuXG4gICAgICBub3RGb3VuZFZhbHVlID0gKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpICYmIG5vdEZvdW5kVmFsdWUgPT09IFRIUk9XX0lGX05PVF9GT1VORCA/XG4gICAgICAgICAgbnVsbCA6XG4gICAgICAgICAgbm90Rm91bmRWYWx1ZTtcbiAgICAgIHJldHVybiBuZXh0SW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm5hbWUgPT09ICdOdWxsSW5qZWN0b3JFcnJvcicpIHtcbiAgICAgICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgICAgIHBhdGgudW5zaGlmdChzdHJpbmdpZnkodG9rZW4pKTtcbiAgICAgICAgaWYgKHByZXZpb3VzSW5qZWN0b3IpIHtcbiAgICAgICAgICAvLyBXZSBzdGlsbCBoYXZlIGEgcGFyZW50IGluamVjdG9yLCBrZWVwIHRocm93aW5nXG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGb3JtYXQgJiB0aHJvdyB0aGUgZmluYWwgZXJyb3IgbWVzc2FnZSB3aGVuIHdlIGRvbid0IGhhdmUgYW55IHByZXZpb3VzIGluamVjdG9yXG4gICAgICAgICAgcmV0dXJuIGNhdGNoSW5qZWN0b3JFcnJvcihlLCB0b2tlbiwgJ1IzSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gTGFzdGx5LCByZXN0b3JlIHRoZSBwcmV2aW91cyBpbmplY3Rpb24gY29udGV4dC5cbiAgICAgIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgICAgbmdEZXZNb2RlICYmIHNldEluamVjdG9yUHJvZmlsZXJDb250ZXh0KHByZXZJbmplY3RDb250ZXh0ISk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICByZXNvbHZlSW5qZWN0b3JJbml0aWFsaXplcnMoKSB7XG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcih0aGlzKTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgICBsZXQgcHJldkluamVjdENvbnRleHQ6IEluamVjdG9yUHJvZmlsZXJDb250ZXh0fHVuZGVmaW5lZDtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBwcmV2SW5qZWN0Q29udGV4dCA9IHNldEluamVjdG9yUHJvZmlsZXJDb250ZXh0KHtpbmplY3RvcjogdGhpcywgdG9rZW46IG51bGx9KTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgaW5pdGlhbGl6ZXJzID0gdGhpcy5nZXQoRU5WSVJPTk1FTlRfSU5JVElBTElaRVIubXVsdGksIEVNUFRZX0FSUkFZLCBJbmplY3RGbGFncy5TZWxmKTtcbiAgICAgIGlmIChuZ0Rldk1vZGUgJiYgIUFycmF5LmlzQXJyYXkoaW5pdGlhbGl6ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX01VTFRJX1BST1ZJREVSLFxuICAgICAgICAgICAgJ1VuZXhwZWN0ZWQgdHlwZSBvZiB0aGUgYEVOVklST05NRU5UX0lOSVRJQUxJWkVSYCB0b2tlbiB2YWx1ZSAnICtcbiAgICAgICAgICAgICAgICBgKGV4cGVjdGVkIGFuIGFycmF5LCBidXQgZ290ICR7dHlwZW9mIGluaXRpYWxpemVyc30pLiBgICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIGNoZWNrIHRoYXQgdGhlIGBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUmAgdG9rZW4gaXMgY29uZmlndXJlZCBhcyBhICcgK1xuICAgICAgICAgICAgICAgICdgbXVsdGk6IHRydWVgIHByb3ZpZGVyLicpO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBpbml0aWFsaXplciBvZiBpbml0aWFsaXplcnMpIHtcbiAgICAgICAgaW5pdGlhbGl6ZXIoKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgICAgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgICBuZ0Rldk1vZGUgJiYgc2V0SW5qZWN0b3JQcm9maWxlckNvbnRleHQocHJldkluamVjdENvbnRleHQhKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSB0b1N0cmluZygpIHtcbiAgICBjb25zdCB0b2tlbnM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMucmVjb3JkcztcbiAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHJlY29yZHMua2V5cygpKSB7XG4gICAgICB0b2tlbnMucHVzaChzdHJpbmdpZnkodG9rZW4pKTtcbiAgICB9XG4gICAgcmV0dXJuIGBSM0luamVjdG9yWyR7dG9rZW5zLmpvaW4oJywgJyl9XWA7XG4gIH1cblxuICBhc3NlcnROb3REZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklOSkVDVE9SX0FMUkVBRFlfREVTVFJPWUVELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnSW5qZWN0b3IgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBgU2luZ2xlUHJvdmlkZXJgIGFuZCBhZGQgaXQuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NQcm92aWRlcihwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpOiB2b2lkIHtcbiAgICAvLyBEZXRlcm1pbmUgdGhlIHRva2VuIGZyb20gdGhlIHByb3ZpZGVyLiBFaXRoZXIgaXQncyBpdHMgb3duIHRva2VuLCBvciBoYXMgYSB7cHJvdmlkZTogLi4ufVxuICAgIC8vIHByb3BlcnR5LlxuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGxldCB0b2tlbjogYW55ID1cbiAgICAgICAgaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlciAmJiBwcm92aWRlci5wcm92aWRlKTtcblxuICAgIC8vIENvbnN0cnVjdCBhIGBSZWNvcmRgIGZvciB0aGUgcHJvdmlkZXIuXG4gICAgY29uc3QgcmVjb3JkID0gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlcik7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgcnVuSW5JbmplY3RvclByb2ZpbGVyQ29udGV4dCh0aGlzLCB0b2tlbiwgKCkgPT4ge1xuICAgICAgICAvLyBFbWl0IEluamVjdG9yUHJvZmlsZXJFdmVudFR5cGUuQ3JlYXRlIGlmIHByb3ZpZGVyIGlzIGEgdmFsdWUgcHJvdmlkZXIgYmVjYXVzZVxuICAgICAgICAvLyB0aGVzZSBhcmUgdGhlIG9ubHkgcHJvdmlkZXJzIHRoYXQgZG8gbm90IGdvIHRocm91Z2ggdGhlIHZhbHVlIGh5ZHJhdGlvbiBsb2dpY1xuICAgICAgICAvLyB3aGVyZSB0aGlzIGV2ZW50IHdvdWxkIG5vcm1hbGx5IGJlIGVtaXR0ZWQgZnJvbS5cbiAgICAgICAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgICAgICBlbWl0SW5zdGFuY2VDcmVhdGVkQnlJbmplY3RvckV2ZW50KHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVtaXRQcm92aWRlckNvbmZpZ3VyZWRFdmVudChwcm92aWRlcik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIWlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSAmJiBwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgLy8gSWYgdGhlIHByb3ZpZGVyIGluZGljYXRlcyB0aGF0IGl0J3MgYSBtdWx0aS1wcm92aWRlciwgcHJvY2VzcyBpdCBzcGVjaWFsbHkuXG4gICAgICAvLyBGaXJzdCBjaGVjayB3aGV0aGVyIGl0J3MgYmVlbiBkZWZpbmVkIGFscmVhZHkuXG4gICAgICBsZXQgbXVsdGlSZWNvcmQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChtdWx0aVJlY29yZCkge1xuICAgICAgICAvLyBJdCBoYXMuIFRocm93IGEgbmljZSBlcnJvciBpZlxuICAgICAgICBpZiAobmdEZXZNb2RlICYmIG11bHRpUmVjb3JkLm11bHRpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvd01peGVkTXVsdGlQcm92aWRlckVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG11bHRpUmVjb3JkID0gbWFrZVJlY29yZCh1bmRlZmluZWQsIE5PVF9ZRVQsIHRydWUpO1xuICAgICAgICBtdWx0aVJlY29yZC5mYWN0b3J5ID0gKCkgPT4gaW5qZWN0QXJncyhtdWx0aVJlY29yZCEubXVsdGkhKTtcbiAgICAgICAgdGhpcy5yZWNvcmRzLnNldCh0b2tlbiwgbXVsdGlSZWNvcmQpO1xuICAgICAgfVxuICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgIG11bHRpUmVjb3JkLm11bHRpIS5wdXNoKHByb3ZpZGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChuZ0Rldk1vZGUgJiYgZXhpc3RpbmcgJiYgZXhpc3RpbmcubXVsdGkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvd01peGVkTXVsdGlQcm92aWRlckVycm9yKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIHJlY29yZCk7XG4gIH1cblxuICBwcml2YXRlIGh5ZHJhdGU8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIHJlY29yZDogUmVjb3JkPFQ+KTogVCB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiByZWNvcmQudmFsdWUgPT09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihzdHJpbmdpZnkodG9rZW4pKTtcbiAgICB9IGVsc2UgaWYgKHJlY29yZC52YWx1ZSA9PT0gTk9UX1lFVCkge1xuICAgICAgcmVjb3JkLnZhbHVlID0gQ0lSQ1VMQVI7XG5cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgcnVuSW5JbmplY3RvclByb2ZpbGVyQ29udGV4dCh0aGlzLCB0b2tlbiBhcyBUeXBlPFQ+LCAoKSA9PiB7XG4gICAgICAgICAgcmVjb3JkLnZhbHVlID0gcmVjb3JkLmZhY3RvcnkhKCk7XG4gICAgICAgICAgZW1pdEluc3RhbmNlQ3JlYXRlZEJ5SW5qZWN0b3JFdmVudChyZWNvcmQudmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlY29yZC52YWx1ZSA9IHJlY29yZC5mYWN0b3J5ISgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHJlY29yZC52YWx1ZSA9PT0gJ29iamVjdCcgJiYgcmVjb3JkLnZhbHVlICYmIGhhc09uRGVzdHJveShyZWNvcmQudmFsdWUpKSB7XG4gICAgICB0aGlzLl9uZ09uRGVzdHJveUhvb2tzLmFkZChyZWNvcmQudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkLnZhbHVlIGFzIFQ7XG4gIH1cblxuICBwcml2YXRlIGluamVjdGFibGVEZWZJblNjb3BlKGRlZjogybXJtUluamVjdGFibGVEZWNsYXJhdGlvbjxhbnk+KTogYm9vbGVhbiB7XG4gICAgaWYgKCFkZWYucHJvdmlkZWRJbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBwcm92aWRlZEluID0gcmVzb2x2ZUZvcndhcmRSZWYoZGVmLnByb3ZpZGVkSW4pO1xuICAgIGlmICh0eXBlb2YgcHJvdmlkZWRJbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBwcm92aWRlZEluID09PSAnYW55JyB8fCAodGhpcy5zY29wZXMuaGFzKHByb3ZpZGVkSW4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5oYXMocHJvdmlkZWRJbik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVPbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBjb25zdCBkZXN0cm95Q0JJZHggPSB0aGlzLl9vbkRlc3Ryb3lIb29rcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICBpZiAoZGVzdHJveUNCSWR4ICE9PSAtMSkge1xuICAgICAgdGhpcy5fb25EZXN0cm95SG9va3Muc3BsaWNlKGRlc3Ryb3lDQklkeCwgMSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeSh0b2tlbjogUHJvdmlkZXJUb2tlbjxhbnk+KTogRmFjdG9yeUZuPGFueT4ge1xuICAvLyBNb3N0IHRva2VucyB3aWxsIGhhdmUgYW4gaW5qZWN0YWJsZSBkZWYgZGlyZWN0bHkgb24gdGhlbSwgd2hpY2ggc3BlY2lmaWVzIGEgZmFjdG9yeSBkaXJlY3RseS5cbiAgY29uc3QgaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICBjb25zdCBmYWN0b3J5ID0gaW5qZWN0YWJsZURlZiAhPT0gbnVsbCA/IGluamVjdGFibGVEZWYuZmFjdG9yeSA6IGdldEZhY3RvcnlEZWYodG9rZW4pO1xuXG4gIGlmIChmYWN0b3J5ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH1cblxuICAvLyBJbmplY3Rpb25Ub2tlbnMgc2hvdWxkIGhhdmUgYW4gaW5qZWN0YWJsZSBkZWYgKMm1cHJvdikgYW5kIHRodXMgc2hvdWxkIGJlIGhhbmRsZWQgYWJvdmUuXG4gIC8vIElmIGl0J3MgbWlzc2luZyB0aGF0LCBpdCdzIGFuIGVycm9yLlxuICBpZiAodG9rZW4gaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbikge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9JTkpFQ1RJT05fVE9LRU4sXG4gICAgICAgIG5nRGV2TW9kZSAmJiBgVG9rZW4gJHtzdHJpbmdpZnkodG9rZW4pfSBpcyBtaXNzaW5nIGEgybVwcm92IGRlZmluaXRpb24uYCk7XG4gIH1cblxuICAvLyBVbmRlY29yYXRlZCB0eXBlcyBjYW4gc29tZXRpbWVzIGJlIGNyZWF0ZWQgaWYgdGhleSBoYXZlIG5vIGNvbnN0cnVjdG9yIGFyZ3VtZW50cy5cbiAgaWYgKHRva2VuIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZ2V0VW5kZWNvcmF0ZWRJbmplY3RhYmxlRmFjdG9yeSh0b2tlbik7XG4gIH1cblxuICAvLyBUaGVyZSB3YXMgbm8gd2F5IHRvIHJlc29sdmUgYSBmYWN0b3J5IGZvciB0aGlzIHRva2VuLlxuICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9JTkpFQ1RJT05fVE9LRU4sIG5nRGV2TW9kZSAmJiAndW5yZWFjaGFibGUnKTtcbn1cblxuZnVuY3Rpb24gZ2V0VW5kZWNvcmF0ZWRJbmplY3RhYmxlRmFjdG9yeSh0b2tlbjogRnVuY3Rpb24pIHtcbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBwYXJhbWV0ZXJzIHRoZW4gaXQgaGFzIGRlcGVuZGVuY2llcyB0aGF0IHdlIGNhbm5vdCByZXNvbHZlIGltcGxpY2l0bHkuXG4gIGNvbnN0IHBhcmFtTGVuZ3RoID0gdG9rZW4ubGVuZ3RoO1xuICBpZiAocGFyYW1MZW5ndGggPiAwKSB7XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBuZXdBcnJheShwYXJhbUxlbmd0aCwgJz8nKTtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklOVkFMSURfSU5KRUNUSU9OX1RPS0VOLFxuICAgICAgICBuZ0Rldk1vZGUgJiYgYENhbid0IHJlc29sdmUgYWxsIHBhcmFtZXRlcnMgZm9yICR7c3RyaW5naWZ5KHRva2VuKX06ICgke2FyZ3Muam9pbignLCAnKX0pLmApO1xuICB9XG5cbiAgLy8gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGFwcGVhcnMgdG8gaGF2ZSBubyBwYXJhbWV0ZXJzLlxuICAvLyBUaGlzIG1pZ2h0IGJlIGJlY2F1c2UgaXQgaW5oZXJpdHMgZnJvbSBhIHN1cGVyLWNsYXNzLiBJbiB3aGljaCBjYXNlLCB1c2UgYW4gaW5qZWN0YWJsZVxuICAvLyBkZWYgZnJvbSBhbiBhbmNlc3RvciBpZiB0aGVyZSBpcyBvbmUuXG4gIC8vIE90aGVyd2lzZSB0aGlzIHJlYWxseSBpcyBhIHNpbXBsZSBjbGFzcyB3aXRoIG5vIGRlcGVuZGVuY2llcywgc28gcmV0dXJuIGEgZmFjdG9yeSB0aGF0XG4gIC8vIGp1c3QgaW5zdGFudGlhdGVzIHRoZSB6ZXJvLWFyZyBjb25zdHJ1Y3Rvci5cbiAgY29uc3QgaW5oZXJpdGVkSW5qZWN0YWJsZURlZiA9IGdldEluaGVyaXRlZEluamVjdGFibGVEZWYodG9rZW4pO1xuICBpZiAoaW5oZXJpdGVkSW5qZWN0YWJsZURlZiAhPT0gbnVsbCkge1xuICAgIHJldHVybiAoKSA9PiBpbmhlcml0ZWRJbmplY3RhYmxlRGVmLmZhY3RvcnkodG9rZW4gYXMgVHlwZTxhbnk+KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKCkgPT4gbmV3ICh0b2tlbiBhcyBUeXBlPGFueT4pKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpOiBSZWNvcmQ8YW55PiB7XG4gIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQodW5kZWZpbmVkLCBwcm92aWRlci51c2VWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gcHJvdmlkZXJUb0ZhY3RvcnkocHJvdmlkZXIpO1xuICAgIHJldHVybiBtYWtlUmVjb3JkKGZhY3RvcnksIE5PVF9ZRVQpO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgYSBgU2luZ2xlUHJvdmlkZXJgIGludG8gYSBmYWN0b3J5IGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSBwcm92aWRlciBwcm92aWRlciB0byBjb252ZXJ0IHRvIGZhY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVyVG9GYWN0b3J5KFxuICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlPzogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVycz86IGFueVtdKTogKCkgPT4gYW55IHtcbiAgbGV0IGZhY3Rvcnk6ICgoKSA9PiBhbnkpfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgaWYgKG5nRGV2TW9kZSAmJiBpc0Vudmlyb25tZW50UHJvdmlkZXJzKHByb3ZpZGVyKSkge1xuICAgIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IodW5kZWZpbmVkLCBwcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgfVxuXG4gIGlmIChpc1R5cGVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICBjb25zdCB1bndyYXBwZWRQcm92aWRlciA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgICByZXR1cm4gZ2V0RmFjdG9yeURlZih1bndyYXBwZWRQcm92aWRlcikgfHwgaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KHVud3JhcHBlZFByb3ZpZGVyKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoaXNWYWx1ZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IHByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzIHx8IFtdKSk7XG4gICAgfSBlbHNlIGlmIChpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gybXJtWluamVjdChyZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci51c2VFeGlzdGluZykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjbGFzc1JlZiA9IHJlc29sdmVGb3J3YXJkUmVmKFxuICAgICAgICAgIHByb3ZpZGVyICYmXG4gICAgICAgICAgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgfHwgcHJvdmlkZXIucHJvdmlkZSkpO1xuICAgICAgaWYgKG5nRGV2TW9kZSAmJiAhY2xhc3NSZWYpIHtcbiAgICAgICAgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvcihuZ01vZHVsZVR5cGUsIHByb3ZpZGVycywgcHJvdmlkZXIpO1xuICAgICAgfVxuICAgICAgaWYgKGhhc0RlcHMocHJvdmlkZXIpKSB7XG4gICAgICAgIGZhY3RvcnkgPSAoKSA9PiBuZXcgKGNsYXNzUmVmKSguLi5pbmplY3RBcmdzKHByb3ZpZGVyLmRlcHMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXRGYWN0b3J5RGVmKGNsYXNzUmVmKSB8fCBpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkoY2xhc3NSZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFjdG9yeTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlY29yZDxUPihcbiAgICBmYWN0b3J5OiAoKCkgPT4gVCl8dW5kZWZpbmVkLCB2YWx1ZTogVHx7fSwgbXVsdGk6IGJvb2xlYW4gPSBmYWxzZSk6IFJlY29yZDxUPiB7XG4gIHJldHVybiB7XG4gICAgZmFjdG9yeTogZmFjdG9yeSxcbiAgICB2YWx1ZTogdmFsdWUsXG4gICAgbXVsdGk6IG11bHRpID8gW10gOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGhhc0RlcHModmFsdWU6IENsYXNzUHJvdmlkZXJ8Q29uc3RydWN0b3JQcm92aWRlcnxcbiAgICAgICAgICAgICAgICAgU3RhdGljQ2xhc3NQcm92aWRlcik6IHZhbHVlIGlzIENsYXNzUHJvdmlkZXIme2RlcHM6IGFueVtdfSB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBhbnkpLmRlcHM7XG59XG5cbmZ1bmN0aW9uIGhhc09uRGVzdHJveSh2YWx1ZTogYW55KTogdmFsdWUgaXMgT25EZXN0cm95IHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiAodmFsdWUgYXMgT25EZXN0cm95KS5uZ09uRGVzdHJveSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gY291bGRCZUluamVjdGFibGVUeXBlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBQcm92aWRlclRva2VuPGFueT4ge1xuICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykgfHxcbiAgICAgICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pO1xufVxuXG5mdW5jdGlvbiBmb3JFYWNoU2luZ2xlUHJvdmlkZXIoXG4gICAgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlcnxFbnZpcm9ubWVudFByb3ZpZGVycz4sIGZuOiAocHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyKSA9PiB2b2lkKTogdm9pZCB7XG4gIGZvciAoY29uc3QgcHJvdmlkZXIgb2YgcHJvdmlkZXJzKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJvdmlkZXIpKSB7XG4gICAgICBmb3JFYWNoU2luZ2xlUHJvdmlkZXIocHJvdmlkZXIsIGZuKTtcbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyICYmIGlzRW52aXJvbm1lbnRQcm92aWRlcnMocHJvdmlkZXIpKSB7XG4gICAgICBmb3JFYWNoU2luZ2xlUHJvdmlkZXIocHJvdmlkZXIuybVwcm92aWRlcnMsIGZuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm4ocHJvdmlkZXIgYXMgU2luZ2xlUHJvdmlkZXIpO1xuICAgIH1cbiAgfVxufVxuIl19