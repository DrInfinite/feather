export interface CleanupElement extends Element {
    _f_attributeCleanups?: { [key: string]: (() => void)[] };
    _f_cleanups?: Function[];
    _f_inited?: boolean;
}
