import { SettingsType } from "@src/Settings/SettingsType";
import PluginHelper from "@src/Utils/PluginHelper";
import EventDispatcherInterface from "@src/Components/EventDispatcher/Interfaces/EventDispatcherInterface";
import { AppEvents } from "@src/Types";
import { Feature } from "@src/Enum";
import Event from "@src/Components/EventDispatcher/Event";
import { ProcessorTypes } from "@src/Components/Processor/ProcessorUtils";

export class Migrator {
    constructor(private config: SettingsType, private dispatcher: EventDispatcherInterface<AppEvents>) {}

    public migrate(version: string): SettingsType {
        if (this.config.version === version) {
            return this.config;
        }
        const currentVersion = this.config.version;
        const versions = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(e => e.startsWith("v"))
            .map(e => e.replace("v", "").replaceAll("_", "."))
            .filter(e => PluginHelper.compareVersion(e, ">", currentVersion))
            .sort((a, b) => {
                if (PluginHelper.compareVersion(a, "<", b)) {
                    return -1;
                } else if (PluginHelper.compareVersion(a, ">", b)) {
                    return 1;
                }
                return 0;
            });
        for (const version of versions) {
            const method = "v" + version.replaceAll(".", "_");
            (this as unknown as Record<string, () => void>)[method]();
        }
        this.dispatcher.dispatch("migrator:migrated", new Event({ from: currentVersion, to: version }));
        return this.config;
    }

    private v3_8_0(): void {
        const features = Object.values(Feature);
        //@ts-ignore
        delete this.config.features["explorer:sort"];
        for (const [k, v] of Object.entries(this.config.templates)) {
            // @ts-ignore
            if (features.contains(k)) {
                this.config.features[k as Feature].templates = v;
                // @ts-ignore
                delete this.config.templates[k];
            }
        }
        return;
    }

    private v1_0_2(): void {
        // 1.0.2 removed the JavaScript processors; a stored one is switched off.
        const type: unknown = this.config.processor?.type;
        if (this.config.processor && type !== null && type !== ProcessorTypes.Replace) {
            this.config.processor = { type: null, args: [] };
        }
    }

    private v3_8_3(): void {
        // Before 3.8.3 the templates were stored as [main, fallback].
        const old: unknown = this.config?.templates;
        if (Array.isArray(old)) {
            const [main, fallback] = old as (string | undefined)[];
            this.config.templates = {
                common: {
                    main: main ?? PluginHelper.createDefaultSettings().templates.common.main,
                    fallback: fallback ?? "",
                },
            };
        }
    }

    private v3_9_0(): void {
        // @ts-ignore
        if (this.config.features.starred) {
            // @ts-ignore
            delete this.config.features.starred;
        }
    }
}
