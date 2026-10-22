import { App, PluginSettingTab } from "obsidian";
import MetaTitlePlugin from "../../main";
import { SettingsEvent, SettingsType } from "@src/Settings/SettingsType";
import Event from "@src/Components/EventDispatcher/Event";
import ObjectHelper from "@src/Utils/ObjectHelper";
import EventDispatcherInterface from "@src/Components/EventDispatcher/Interfaces/EventDispatcherInterface";
import { inject, injectable } from "inversify";
import SI from "@config/inversify.types";
import { KeyStorageInterface } from "@src/Storage/Interfaces";
import { SettingsBuilderFactory } from "@config/inversify.factory.types";
import { t } from "../i18n/Locale";

@injectable()
export default class SettingsTab {
    private previous: SettingsType;
    private tab: PluginSettingTab;

    constructor(
        @inject(SI["obsidian:app"])
        app: App,
        @inject(SI["obsidian:plugin"])
        plugin: MetaTitlePlugin,
        @inject(SI["settings:storage"])
        private storage: KeyStorageInterface<SettingsType>,
        @inject(SI["event:dispatcher"])
        private dispatcher: EventDispatcherInterface<SettingsEvent>,
        @inject(SI["factory:settings:builder"])
        private factory: SettingsBuilderFactory
    ) {
        const self = this;
        this.tab = new (class extends PluginSettingTab {
            display = () => self.display();
            hide = () => self.hide();
        })(app, plugin);
        this.updatePrevious();
        dispatcher.dispatch("settings.loaded", new Event({ settings: this.storage.collect() }));
    }

    get containerEl(): HTMLElement {
        return this.getTab().containerEl;
    }

    private get orderedKeys(): (keyof SettingsType)[] {
        return ["templates", "processor", "rules", "features", "debug", "boot"];
    }

    public getTab(): PluginSettingTab {
        return this.tab;
    }

    display(): any {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl("h2", { text: t("settings") });

        const builders = this.factory<SettingsType>("main");
        for (const k of this.orderedKeys) {
            for (const builder of builders) {
                if (builder.support(k)) {
                    builder.build({
                        name: k,
                        item: this.storage.get(k),
                        container: this.containerEl,
                    });
                }
            }
        }
    }

    hide(): any {
        this.dispatch();
    }

    private updatePrevious(): void {
        this.previous = JSON.parse(JSON.stringify(this.storage.collect()));
    }

    private dispatch(): void {
        this.dispatcher.dispatch("settings:tab:close", null);
        const changed = ObjectHelper.compare(this.previous, this.storage.collect());

        if (Object.keys(changed).length === 0) {
            return;
        }
        this.dispatcher.dispatch(
            "settings:changed",
            new Event({
                old: this.previous,
                actual: this.storage.collect(),
                changed: ObjectHelper.compare(this.previous, this.storage.collect()),
            })
        );
        this.updatePrevious();
    }
}
