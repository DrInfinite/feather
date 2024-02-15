/**
 * Dispatches a custom event on the given element.
 *
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.el - The element on which to dispatch the event. Must have a `dispatchEvent` method.
 * @param {string} params.name - The name of the event to dispatch.
 * @param {Object} [params.detail={}] - The detail to include in the event. Defaults to an empty object.
 *
 * @returns {void} This function does not return anything
 */
export function dispatch(el, name, detail = {}) {
    el.dispatchEvent(
        new CustomEvent(name, {
            detail,
            bubbles: true,
            composed: true,
            cancelable: true,
        }),
    );
}
