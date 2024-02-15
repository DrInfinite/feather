import { cleanupAttributes, cleanupElement } from './mutation';
import { walk } from './utils';

export function destroyTree(root, walker = walk) {
    walker(root, (el) => {
        cleanupAttributes(el);
        cleanupElement(el);

        el._f_inited = undefined;
    });
}
