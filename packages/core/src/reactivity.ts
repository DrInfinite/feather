import { scheduler } from "./scheduler";

let shouldSchedule = true;

/**
 * Temporarily disables effect scheduling, runs the provided callback, and then re-enables effect scheduling.
 *
 * @param {() => void} callback - The callback function to run while effect scheduling is disabled.
 * @returns {void}
 */
export function disableEffectScheduling(callback: () => void): void {
    shouldSchedule = false;

    callback();

    shouldSchedule = true;
}

interface Engine<T, U> {
    reactive: T;
    release: (effectReference: U) => void;
    effect: (
        callback: () => T,
        options: { scheduler: (task: () => void) => void },
    ) => U;
    raw: T;
}

let reactive: unknown;
let effect: <T>(callback: () => T) => unknown;
let release: <U>(effectReference: U) => void;
let raw: unknown;

/**
 * Sets the reactivity engine with the provided engine object.
 * This function sets the reactive, release, effect, and raw properties based on the provided engine object.
 *
 * @template T - The type of the reactive and raw properties in the engine.
 * @template U - The type of the effect reference in the engine.
 *
 * @param {Engine<T, U>} engine - The engine object that contains the reactive, release, effect, and raw properties.
 * @returns {void}
 */
export function setReactivityEngine<T, U>(engine: Engine<T, U>): void {
    reactive = engine.reactive;
    release = engine.release;

    effect = (callback: () => T) => {
        engine.effect(callback, {
            scheduler: (task: () => void) => {
                if (shouldSchedule) {
                    scheduler(task);
                } else {
                    task();
                }
            },
        });
    };

    raw = engine.raw;
}

/**
 * Overrides the current effect function with a new one.
 *
 * @param {(callback: () => T) => unknown} override - The new effect function.
 * @returns {void}
 */
export function overrideEffect(
    override: <T>(callback: () => T) => unknown,
): void {
    effect = override;
}

interface Element {
    // biome-ignore lint/style/useNamingConvention: <explanation>
    _f_effects?: Set<unknown>;
    // biome-ignore lint/style/useNamingConvention: <explanation>
    _f_runEffects?: () => void;
}

/**
 * Binds an effect to an element. The effect will be cleaned up when the element is cleaned up.
 *
 * @param {Element} element - The element to bind the effect to.
 * @returns {[(callback: () => unknown) => unknown, () => void]} - Returns a tuple containing the wrapped effect function and a cleanup function.
 */
export function elementBoundEffect(
    element: Element,
): [(callback: () => unknown) => unknown, () => void] {
    // biome-ignore lint/nursery/noEmptyBlockStatements: <explanation>
    let cleanup = () => {};

    const wrappedEffect = (callback: () => unknown) => {
        const effectReference = effect(callback);

        if (!element._f_effects) {
            element._f_effects = new Set();

            // Livewire depends on element._f_runEffects.
            element._f_runEffects = () => {
                element._f_effects?.forEach((i) => {
                    if (i instanceof Function) {
                        i();
                    }
                });
            };
        }

        element._f_effects.add(effectReference);

        cleanup = () => {
            if (effectReference === undefined) {
                return;
            }

            element._f_effects?.delete(effectReference);

            release(effectReference);
        };

        return effectReference;
    };

    return [
        wrappedEffect,
        () => {
            cleanup();
        },
    ];
}

/**
 * Watches a getter function and calls a callback function when the getter's return value changes.
 *
 * @template T - The type of the value returned by the getter function.
 *
 * @param {() => T} getter - The getter function to watch.
 * @param {(value: T, oldValue: T) => void} callback - The callback function to call when the getter's return value changes.
 * @returns {() => void} - Returns a cleanup function that can be called to stop watching the getter function.
 */
export function watch<T>(
    getter: () => T,
    callback: (value: T, oldValue: T) => void,
): () => void {
    let firstTime = true;

    let oldValue: T;

    const effectReference = effect(() => {
        const value = getter();

        JSON.stringify(value);

        if (firstTime) {
            oldValue = value;
        } else {
            queueMicrotask(() => {
                callback(value, oldValue);

                oldValue = value;
            });
        }

        firstTime = false;
    });

    return () => release(effectReference);
}

export { release, reactive, effect, raw };
