import type { CleanupElement } from "./types/utils";

const onAttributeAddeds: Function[] = [];
const onElRemoveds: CleanupElement[] = [];
const onElAddeds: Function[] = [];

export function onElAdded({ callback }: { callback: Function }): void {
    onElAddeds.push(callback);
}

export function onElRemoved({
    el,
    callback,
}: { el: CleanupElement; callback: Function | CleanupElement }): void {
    if (typeof callback === "function") {
        if (!el._f_cleanups) {
            el._f_cleanups = [];
        }
        el._f_cleanups.push(callback);
    } else {
        const local = el;
        onElRemoveds.push(local);
    }
}

export function onAttributesAdded({ callback }: { callback: Function }): void {
    onAttributeAddeds.push(callback);
}

export function onAttributeRemoved({
    el,
    name,
    callback,
}: { el: CleanupElement; name: string | number; callback: () => void }): void {
    if (!el._f_attributeCleanups) {
        el._f_attributeCleanups = {};
    }
    if (!el._f_attributeCleanups[name]) {
        el._f_attributeCleanups[name] = [];
    }

    el._f_attributeCleanups[name].push(callback);
}

export function cleanupAttributes({
    el,
    names,
}: { el: CleanupElement; names?: string[] }): void {
    if (!el._f_attributeCleanups) {
        return;
    }

    Object.entries(el._f_attributeCleanups).forEach(([name, value]) => {
        if (names === undefined || names.includes(name)) {
            value.forEach((i) => i());

            delete el._f_attributeCleanups?.[name];
        }
    });
}

export function cleanupElement({ el }: { el: CleanupElement }): void {
    if (el._f_cleanups) {
        while (el._f_cleanups.length) {
            el._f_cleanups.pop()?.();
        }
    }
}
