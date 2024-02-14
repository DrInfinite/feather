export interface NodeWithAttributes extends Node {
    _f_ignoreMutationObserver?: boolean;
    _f_ignoreSelf?: boolean;
    _f_ignore?: boolean;
    getAttribute: (name: string) => string;
    hasAttribute: (name: string) => boolean;
}

export interface Mutation {
    target: NodeWithAttributes;
    type: string;
    addedNodes: NodeListOf<ChildNode>;
    removedNodes: NodeListOf<ChildNode>;
    attributeName?: string;
    oldValue?: string;
}
