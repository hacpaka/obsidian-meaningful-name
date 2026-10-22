import { TFileExplorerItem } from "obsidian";
import { ResolverInterface } from "@src/Resolver/Interfaces";
import { injectable } from "inversify";

@injectable()
export class ExplorerFileItemMutator {
    constructor(
        private readonly item: TFileExplorerItem,
        private readonly resolver: ResolverInterface
    ) {
        item.updateTitle = () => this.updateTitle();
        item.startRename = () => this.startRename();
    }

    public destroy() {
        // Dropping the own overrides brings back the prototype's methods.
        delete this.item.updateTitle;
        delete this.item.startRename;
    }

    private getProto(): TFileExplorerItem {
        return Object.getPrototypeOf(this.item) as TFileExplorerItem;
    }

    private updateTitle(): void {
        this.getProto().updateTitle.call(this.item);
        const title = this.resolver.resolve(this.item.file.path);
        if (title?.length > 0) {
            this.item.innerEl.setText(title);
        }
    }

    private startRename(): void {
        this.item.innerEl.setText(this.item.getTitle());
        this.getProto().startRename.call(this.item);
    }
}
