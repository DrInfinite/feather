let prefixAsString = 'f-';

export function prefix(subject = '') {
    return prefixAsString + subject;
}

export function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
}

const directiveHandlers = {};

export function directive(name, callback) {
    directiveHandlers[name] = callback;

    return {
        before(directive) {
            if (!directiveHandlers[directive]) {
                console.warn(
                    String.raw`Cannot find directive \`${directive}\`. \`${name}\` will use the default order of execution`,
                );
                return;
            }
            const pos = directiveOrder.indexOf(directive);
            directiveOrder.splice(
                pos >= 0 ? pos : directiveOrder.indexOf('DEFAULT'),
                0,
                name,
            );
        },
    };
}

const DEFAULT = 'DEFAULT';

const directiveOrder = [
    'ignore',
    'ref',
    'data',
    'id',
    'anchor',
    'bind',
    'init',
    'for',
    'model',
    'modelable',
    'transition',
    'show',
    'if',
    DEFAULT,
    'teleport',
];

function byPriority(a, b) {
    const typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    const typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;

    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
}
