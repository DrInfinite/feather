import { cleanupAttributes, cleanupElement } from "./mutation";
import type { CleanupElement } from "./types/utils";
import { walk } from "./utils/walk";

export function destroyTree({
    root,
    walker = walk,
}: {
    root: CleanupElement;
    walker?: (
        el: Element,
        callback: (el: CleanupElement, skip: () => void) => void,
    ) => void;
}) {
    walker(root, (el) => {
        cleanupAttributes({ el });
        cleanupElement({ el });

        el._f_inited = undefined;
    });
}
