import { SettingsType } from "@src/Settings/SettingsType";
import PluginHelper from "@src/Utils/PluginHelper";
import EventDispatcherInterface from "@src/Components/EventDispatcher/Interfaces/EventDispatcherInterface";
import { AppEvents } from "@src/Types";
import { Feature } from "@src/Enum";
import Event from "@src/Components/EventDispatcher/Event";
import { ProcessorTypes } from "@src/Components/Processor/ProcessorUtils";

export class Migrator {
    constructor(
        private config: SettingsType,
        private dispatcher: EventDispatcherInterface<AppEvents>
    ) {}

    public migrate(version: string): SettingsType {
        if (this.config.version === version) {
            return this.config;
        }
        const currentVersion = this.config.version;
        for (const version of Object.getOwnPropertyNames(Object.getPrototypeOf(this))
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
            })) {
            (this as unknown as Record<string, () => void>)["v" + version.replaceAll(".", "_")]();
        }
        this.dispatcher.dispatch("migrator:migrated", new Event({ from: currentVersion, to: version }));
        return this.config;
    }

    private v3_8_0(): void {
        delete (this.config.features as unknown as Record<string, unknown>)["explorer:sort"];
        for (const [k, v] of Object.entries(this.config.templates)) {
            if ((Object.values(Feature) as string[]).contains(k)) {
                this.config.features[k as Feature].templates = v;
                delete (this.config.templates as Record<string, unknown>)[k];
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
        // "starred" was a feature before 3.9.0.
        const features = this.config.features as unknown as Record<string, unknown>;
        if (features.starred) {
            delete features.starred;
        }
    }
}
