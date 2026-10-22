import { SearchDOM, TFile } from "obsidian";
import { ResolverInterface } from "../Resolver/Interfaces";
import FunctionReplacer from "./FunctionReplacer";

export default class ResultDomWrapper {
    private replacer: FunctionReplacer<SearchDOM, "addResult", ResultDomWrapper> = null;

    constructor(
        private resolver: ResolverInterface = null,
        dom: SearchDOM
    ) {
        this.replacer = FunctionReplacer.tryCreate(dom, "addResult", this, (self, defaultArgs, vanilla) => {
            const c = vanilla.call(dom, ...defaultArgs) as { containerEl: HTMLElement };
            self.processLookupItem(defaultArgs[0], c);
            return c;
        });
        if (!this.replacer) {
            return;
        }
        this.replacer.enable();
        this.process();
    }

    public disable(): void {
        this.replacer?.disable();
        this.replacer = null;
    }

    private process(): void {
        for (const [file, item] of this.replacer?.getTarget()?.resultDomLookup ??
            new Map<TFile, { containerEl: HTMLElement }>()) {
            this.processLookupItem(file, item);
        }
    }

    private processLookupItem(file: TFile, item: { containerEl: HTMLElement }): void {
        if (file.extension !== "md") {
            return;
        }
        const node = item?.containerEl?.firstElementChild?.find(".tree-item-inner");
        if (!node) {
            return;
        }
        const text = (this?.replacer?.isEnabled() ? this.resolver.resolve(file.path) : null) ?? file.basename;
        if (node.getText() !== text) {
            node.setText(text);
        }
    }
}
