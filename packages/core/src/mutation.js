import { destroyTree } from './lifecycle';

const onAttributeAddeds = [];
const onElRemoveds = [];
const onElAddeds = [];

export function onElAdded(callback) {
    onElAddeds.push(callback);
}

export function onElRemoved(el, callback) {
    if (typeof callback === 'function') {
        if (!el._f_cleanups) {
            el._f_cleanups = [];
        }
        el._f_cleanups.push(callback);
    } else {
        const localCallback = el;
        onElRemoveds.push(localCallback);
    }
}

export function onAttributesAdded(callback) {
    onAttributeAddeds.push(callback);
}

export function onAttributeRemoved(el, name, callback) {
    if (!el._f_attributeCleanups) {
        el._f_attributeCleanups = {};
    }
    if (!el._f_attributeCleanups[name]) {
        el._f_attributeCleanups[name] = [];
    }

    el._f_attributeCleanups[name].push(callback);
}

export function cleanupAttributes(el, names) {
    if (!el._f_attributeCleanups) {
        return;
    }

    for (const [name, value] of Object.entries(el._f_attributeCleanups)) {
        if (names === undefined || names.includes(name)) {
            for (const i of value) {
                i();
            }

            el._f_attributeCleanups[name] = undefined;
        }
    }
}

export function cleanupElement(el) {
    if (el._f_cleanups) {
        while (el._f_cleanups.length) {
            el._f_cleanups.pop()();
        }
    }
}

const observer = new MutationObserver(onMutate);

let currentlyObserving = false;

export function startObservingMutations() {
    observer.observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
    });

    currentlyObserving = true;
}

export function stopObservingMutations() {
    flushObserver();

    observer.disconnect();

    currentlyObserving = false;
}

const queuedMutations = [];

export function flushObserver() {
    const records = observer.takeRecords();

    queuedMutations.push(() => records.length > 0 && onMutate(records));

    const queueLengthWhenTriggered = queuedMutations.length;

    queueMicrotask(() => {
        // If these two lengths match, then we KNOW that this is the LAST
        // flush in the current event loop. This way, we can process
        // all mutations in one batch at the end of everything...
        if (queuedMutations.length === queueLengthWhenTriggered) {
            // Now Alpine can process all the mutations...
            while (queuedMutations.length > 0) {
                queuedMutations.shift()();
            }
        }
    });
}

export function mutateDom(callback) {
    if (!currentlyObserving) {
        return callback();
    }

    stopObservingMutations();

    const result = callback();

    startObservingMutations();

    return result;
}

let isCollecting = false;
let deferredMutations = [];

export function deferMutations() {
    isCollecting = true;
}

export function flushAndStopDeferringMutations() {
    isCollecting = false;

    onMutate(deferredMutations);

    deferredMutations = [];
}

function onMutate(mutations) {
    if (isCollecting) {
        deferredMutations = deferredMutations.concat(mutations);

        return;
    }

    let addedNodes = new Set();
    let removedNodes = new Set();
    let addedAttributes = new Map();
    let removedAttributes = new Map();

    for (const mutation of mutations) {
        if (mutation.target._f_ignoreMutationObserver) {
            continue;
        }

        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    addedNodes.add(node);
                }
            }
            for (const node of mutation.removedNodes) {
                if (node.nodeType === 1) {
                    removedNodes.add(node);
                }
            }
        }

        if (mutation.type === 'attributes') {
            const el = mutation.target;
            const name = mutation.attributeName;
            const oldValue = mutation.oldValue;

            const add = () => {
                if (!addedAttributes.has(el)) {
                    addedAttributes.set(el, []);
                }

                addedAttributes
                    .get(el)
                    .push({ name, value: el.getAttribute(name) });
            };

            const remove = () => {
                if (!removedAttributes.has(el)) {
                    removedAttributes.set(el, []);
                }

                removedAttributes.get(el).push(name);
            };

            if (el.hasAttribute(name) && oldValue === null) {
                add();
            } else if (el.hasAttribute(name)) {
                remove();
                add();
            } else {
                remove();
            }
        }
    }

    removedAttributes.forEach((attrs, el) => {
        cleanupAttributes(el, attrs);
    });

    addedAttributes.forEach((attrs, el) => {
        for (const i of onAttributeAddeds) {
            i(el, attrs);
        }
    });

    for (const node of removedNodes) {
        if (addedNodes.has(node)) {
            continue;
        }

        for (const i of onElAddeds) {
            i(node);
        }

        destroyTree(node);
    }

    for (const node of addedNodes) {
        node._f_ignoreSelf = true;
        node._f_ignore = true;
    }
    for (const node of addedNodes) {
        if (!node.isConnected) {
            continue;
        }

        node._f_ignoreSelf = undefined;
        node._f_ignore = undefined;
        for (const i of onElAddeds) {
            i(node);
        }
        node._f_ignore = true;
        node._f_ignoreSelf = true;
    }
    for (const node of addedNodes) {
        node._f_ignoreSelf = undefined;
        node._f_ignore = undefined;
    }

    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
}

/* 
function onMutate(mutations) {
    if (isCollecting) {
        deferredMutations = deferredMutations.concat(mutations);
        return;
    }

    let addedNodes = new Set();
    let removedNodes = new Set();
    let addedAttributes = new Map();
    let removedAttributes = new Map();

    function processChildListMutation(mutation) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
                addedNodes.add(node);
            }
        }
        for (const node of mutation.removedNodes) {
            if (node.nodeType === 1) {
                removedNodes.add(node);
            }
        }
    }

    function processAttributesMutation(mutation) {
        const el = mutation.target;
        const name = mutation.attributeName;
        const oldValue = mutation.oldValue;

        const addAttribute = () => {
            if (!addedAttributes.has(el)) {
                addedAttributes.set(el, []);
            }

            addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
        };

        const removeAttribute = () => {
            if (!removedAttributes.has(el)) {
                removedAttributes.set(el, []);
            }

            removedAttributes.get(el).push(name);
        };

        if (mutation.type === 'attributes') {
            if (el.hasAttribute(name) && oldValue === null) {
                addAttribute();
            } else if (el.hasAttribute(name)) {
                removeAttribute();
                addAttribute();
            } else {
                removeAttribute();
            }
        }
    }

    mutations.forEach((mutation) => {
        if (mutation.target._f_ignoreMutationObserver) {
            return;
        }

        if (mutation.type === 'childList') {
            processChildListMutation(mutation);
        } else if (mutation.type === 'attributes') {
            processAttributesMutation(mutation);
        }
    });

    removedAttributes.forEach((attrs, el) => cleanupAttributes(el, attrs));

    addedAttributes.forEach((attrs, el) => {
        onAttributeAddeds.forEach((callback) => callback(el, attrs));
    });

    function processAddedNodes(nodeSet) {
        nodeSet.forEach((node) => {
            if (!node.isConnected) {
                return;
            }

            for (const callback of onElAddeds) {
                callback(node);
            }
            node._f_ignore = true;
            node._f_ignoreSelf = true;
        });
    }

    processAddedNodes(removedNodes);
    processAddedNodes(addedNodes);

    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
}

*/