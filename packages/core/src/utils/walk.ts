import type { CleanupElement } from "../types/utils";

/**
 * Recursively walks through an element and its children in the DOM, applying a callback function to each element.
 *
 * @param {Element} el - The element to start walking from. It can be any object that extends the `Element` interface, including `ShadowRoot`.
 * @param {function} callback - A function that gets called for each element in the walk. This function receives two parameters:
 *   1. `el`: The current element in the walk.
 *   2. `skip`: A function that, when called, will cause the walk to skip the current element's descendants.
 *
 * @returns {void} This function does not return anything.
 */
export function walk(
    el: Element,
    callback: (el: CleanupElement, skip: () => void) => void,
): void {
    if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
        Array.from(el.children).forEach((el) => walk(el, callback));

        return;
    }

    let skip = false;

    const skipper = () => {
        skip = true;
    };
    callback(el, skipper);

    if (skip) {
        return;
    }

    let node = el.firstElementChild;

    while (node) {
        walk(node, callback);

        node = node.nextElementSibling;
    }
}
