import { App, PluginSettingTab, SettingDefinition, SettingDefinitionItem, SettingDefinitionPage } from "obsidian";
import MetaTitlePlugin from "../../main";
import { SettingsEvent, SettingsType } from "@src/Settings/SettingsType";
import Event from "@src/Components/EventDispatcher/Event";
import ObjectHelper from "@src/Utils/ObjectHelper";
import EventDispatcherInterface from "@src/Components/EventDispatcher/Interfaces/EventDispatcherInterface";
import { inject, injectable } from "inversify";
import SI from "@config/inversify.types";
import { KeyStorageInterface } from "@src/Storage/Interfaces";
import FeatureHelper from "@src/Utils/FeatureHelper";
import { Feature, GITHUB_DOCS } from "@src/Enum";
import { ProcessorTypes } from "@src/Components/Processor/ProcessorUtils";
import { StrategyType, ValidatorType } from "@src/Feature/Alias/Types";
import { NoteLinkStrategy } from "@src/Feature/NoteLink/NoteLinkTypes";
import { t } from "../i18n/Locale";

// A node of the settings storage, reached by a dotted key such as "features.alias.strategy".
type Node = { get(key: string): Node; set(value: unknown): void; value(): unknown };

// Keys whose stored value has a different shape from what their control shows.
const PATHS = "rules.paths.values";
const DELIMITER = "rules.delimiter.mode";
const PROCESSOR = "processor.type";
const ARG = /^processor\.args\.(\d)$/;

class Tab extends PluginSettingTab {
    constructor(
        app: App,
        plugin: MetaTitlePlugin,
        private owner: SettingsTab
    ) {
        super(app, plugin);
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        return this.owner.definitions();
    }

    getControlValue(key: string): unknown {
        return this.owner.read(key);
    }

    setControlValue(key: string, value: unknown): void {
        this.owner.write(key, value);
        // Rows that depend on this value show or hide.
        this.refreshDomState();
    }

    hide(): void {
        super.hide();
        this.owner.close();
    }
}

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
        @inject(SI["feature:helper"])
        private helper: FeatureHelper
    ) {
        this.tab = new Tab(app, plugin, this);
        this.updatePrevious();
        dispatcher.dispatch("settings.loaded", new Event({ settings: this.storage.collect() }));
    }

    public getTab(): PluginSettingTab {
        return this.tab;
    }

    public definitions(): SettingDefinitionItem[] {
        const features = this.helper.getOrderedFeatures();
        return [
            { type: "group", heading: t("templates"), items: this.templates() },
            { type: "group", heading: t("processor.name"), items: this.processor() },
            { type: "group", heading: t("rule.name"), items: this.rules() },
            { type: "group", heading: t("features"), items: features.map(f => this.toggle(f)) },
            { type: "group", heading: t("featureSettings"), items: features.map(f => this.page(f)) },
            { type: "group", heading: t("util"), items: this.util() },
        ];
    }

    public read(key: string): unknown {
        const s = this.storage;
        if (key === PATHS) {
            return s.get("rules").get("paths").get("values").value().join("\n");
        }
        if (key === DELIMITER) {
            return s.get("rules").get("delimiter").get("enabled").value() ? "join" : "first";
        }
        if (key === PROCESSOR) {
            return s.get("processor").get("type").value() ?? "";
        }
        const arg = ARG.exec(key);
        if (arg) {
            return s.get("processor").get("args").value()[Number(arg[1])] ?? "";
        }
        return this.node(key).value();
    }

    public write(key: string, value: unknown): void {
        const s = this.storage;
        if (key === PATHS) {
            s.get("rules")
                .get("paths")
                .get("values")
                .set((value as string).split("\n").filter(e => e));
        } else if (key === DELIMITER) {
            s.get("rules")
                .get("delimiter")
                .get("enabled")
                .set(value === "join");
        } else if (key === PROCESSOR) {
            s.get("processor")
                .get("type")
                .set(value === "" ? null : (value as ProcessorTypes));
        } else if (ARG.test(key)) {
            const item = s.get("processor").get("args");
            const args = Array.from({ length: 3 }, (_, i) => item.value()[i] ?? "");
            args[Number(ARG.exec(key)[1])] = value as string;
            item.set(args);
        } else {
            this.node(key).set(value);
        }
    }

    public close(): void {
        const changed = ObjectHelper.compare(this.previous, this.storage.collect());
        if (Object.keys(changed).length === 0) {
            return;
        }
        this.dispatcher.dispatch(
            "settings:changed",
            new Event({ old: this.previous, actual: this.storage.collect(), changed })
        );
        this.updatePrevious();
    }

    private node(key: string): Node {
        return key.split(".").reduce((n, k) => n.get(k), this.storage as unknown as Node);
    }

    private updatePrevious(): void {
        this.previous = JSON.parse(JSON.stringify(this.storage.collect())) as SettingsType;
    }

    private docs(text: string, page: string): DocumentFragment {
        return createFragment(f => {
            f.appendText(`${text} `);
            f.createEl("a", { text: t("docs"), href: GITHUB_DOCS + page });
        });
    }

    // Lists a dropdown's options with what each one does.
    private choices(items: [string, string][]): DocumentFragment {
        return createFragment(f =>
            items.forEach(([name, desc], i) => {
                if (i > 0) {
                    f.createEl("br");
                }
                f.createEl("strong", { text: name });
                f.appendText(`: ${desc}`);
            })
        );
    }

    private templates(): SettingDefinition[] {
        return [
            {
                name: t("template.common.main.name"),
                desc: this.docs(t("template.common.main.desc"), "Templates.md"),
                control: { type: "text", key: "templates.common.main", placeholder: t("template.placeholder") },
            },
            {
                name: t("template.common.fallback.name"),
                desc: t("template.common.fallback.desc"),
                control: { type: "text", key: "templates.common.fallback", placeholder: t("template.placeholder") },
            },
        ];
    }

    private processor(): SettingDefinition[] {
        const replace = () => this.storage.get("processor").get("type").value() === ProcessorTypes.Replace;
        return [
            {
                name: t("processor.name"),
                desc: this.docs(t("processor.desc"), "Processor.md"),
                control: {
                    type: "dropdown",
                    key: PROCESSOR,
                    options: { "": t("disabled"), [ProcessorTypes.Replace]: t("processor.replace.name") },
                },
            },
            {
                name: t("processor.replace.desc"),
                desc: "title.replace(new RegExp(#pattern#, #flags#), #replacement#)",
                visible: replace,
            },
            ...(["pattern", "flags", "replacement"] as const).map(
                (arg, i): SettingDefinition => ({
                    name: t(`processor.replace.${arg}.name`),
                    desc: t(`processor.replace.${arg}.desc`),
                    visible: replace,
                    control: { type: "text", key: `processor.args.${i}` },
                })
            ),
        ];
    }

    private rules(): SettingDefinition[] {
        return [
            {
                name: t("rule.path.name"),
                control: {
                    type: "dropdown",
                    key: "rules.paths.mode",
                    options: { white: t("rule.path.white.name"), black: t("rule.path.black.name") },
                },
            },
            // One row per mode, so the description always matches the selected mode.
            ...(["white", "black"] as const).map(
                (m): SettingDefinition => ({
                    name: t(`rule.path.${m}.name`),
                    desc: t(`rule.path.${m}.desc`),
                    visible: () => this.storage.get("rules").get("paths").get("mode").value() === m,
                    control: { type: "textarea", key: PATHS },
                })
            ),
            {
                name: t("rule.delimiter.name"),
                desc: t("rule.delimiter.desc"),
                control: {
                    type: "dropdown",
                    key: DELIMITER,
                    options: { first: t("rule.delimiter.first"), join: t("rule.delimiter.join") },
                },
            },
            {
                name: t("rule.delimiter.value"),
                visible: () => this.storage.get("rules").get("delimiter").get("enabled").value(),
                control: {
                    type: "text",
                    key: "rules.delimiter.value",
                    placeholder: t("rule.delimiter.placeholder.join"),
                },
            },
        ];
    }

    private toggle(feature: Feature): SettingDefinition {
        return {
            name: this.helper.getName(feature),
            desc: this.helper.getDescription(feature),
            control: { type: "toggle", key: `features.${feature}.enabled` },
        };
    }

    // A feature's own options and templates, reachable while the feature is on.
    private page(feature: Feature): SettingDefinitionPage {
        const section = this.helper.getDocSection(feature);
        return {
            type: "page",
            name: this.helper.getName(feature),
            desc: section ? this.docs(t("template.features.desc"), section) : t("template.features.desc"),
            visible: () => this.storage.get("features").get(feature).get("enabled").value(),
            items: [...this.options(feature), ...this.featureTemplates(feature)],
        };
    }

    private options(feature: Feature): SettingDefinition[] {
        switch (feature) {
            case Feature.Explorer:
                return [
                    {
                        name: t("feature.explorer.sort.name"),
                        desc: t("feature.explorer.sort.desc"),
                        control: { type: "toggle", key: "features.explorer.sort" },
                    },
                ];
            case Feature.Alias:
                return [
                    {
                        name: t("validator"),
                        desc: this.choices([
                            [t("feature.alias.validator.auto.name"), t("feature.alias.validator.auto.desc")],
                            [t("feature.alias.validator.required.name"), t("feature.alias.validator.required.desc")],
                        ]),
                        control: {
                            type: "dropdown",
                            key: "features.alias.validator",
                            defaultValue: ValidatorType.FrontmatterRequired,
                            options: {
                                [ValidatorType.FrontmatterAuto]: t("feature.alias.validator.auto.name"),
                                [ValidatorType.FrontmatterRequired]: t("feature.alias.validator.required.name"),
                            },
                        },
                    },
                    {
                        name: t("strategy"),
                        desc: this.choices([
                            [t("feature.alias.strategy.ensure.name"), t("feature.alias.strategy.ensure.desc")],
                            [t("feature.alias.strategy.adjust.name"), t("feature.alias.strategy.adjust.desc")],
                            [t("feature.alias.strategy.replace.name"), t("feature.alias.strategy.replace.desc")],
                        ]),
                        control: {
                            type: "dropdown",
                            key: "features.alias.strategy",
                            defaultValue: StrategyType.Ensure,
                            options: {
                                [StrategyType.Ensure]: t("feature.alias.strategy.ensure.name"),
                                [StrategyType.Adjust]: t("feature.alias.strategy.adjust.name"),
                                [StrategyType.Replace]: t("feature.alias.strategy.replace.name"),
                            },
                        },
                    },
                ];
            case Feature.NoteLink:
                return [
                    {
                        name: t("feature.noteLink.strategy.name"),
                        desc: t("feature.noteLink.strategy.desc"),
                        control: {
                            type: "dropdown",
                            key: "features.noteLink.strategy",
                            defaultValue: NoteLinkStrategy.OnlyEmpty,
                            options: {
                                [NoteLinkStrategy.All]: t("feature.noteLink.strategy.options.all"),
                                [NoteLinkStrategy.OnlyEmpty]: t("feature.noteLink.strategy.options.onlyEmpty"),
                            },
                        },
                    },
                    {
                        name: t("feature.noteLink.approval.name"),
                        desc: t("feature.noteLink.approval.desc"),
                        control: { type: "toggle", key: "features.noteLink.approval" },
                    },
                ];
            default:
                return [];
        }
    }

    private featureTemplates(feature: Feature): SettingDefinition[] {
        const common = this.storage.get("templates").get("common");
        return (["main", "fallback"] as const).map(type => {
            return {
                name: t(`template.${type}`),
                desc: this.storage.get("features").get(feature).get("templates").get(type).value()
                    ? t("template.specific")
                    : t("template.used", { value: common.get(type).value() }),
                control: {
                    type: "text",
                    key: `features.${feature}.templates.${type}`,
                    placeholder: common.get(type).value() ?? "",
                },
            };
        });
    }

    private util(): SettingDefinition[] {
        return [
            {
                name: t("debug_info.title"),
                desc: t("debug_info.desc"),
                control: { type: "toggle", key: "debug" },
            },
            {
                name: t("boot_delay.title"),
                desc: t("boot_delay.desc"),
                control: { type: "number", key: "boot.delay", min: 0, step: 1 },
            },
            {
                name: t("boot_background.title"),
                desc: t("boot_background.desc"),
                control: { type: "toggle", key: "boot.background" },
            },
        ];
    }
}
