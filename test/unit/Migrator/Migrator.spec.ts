import { Migrator } from "@src/Migrator/Migrator";
import { SettingsType } from "@src/Settings/SettingsType";
import { mock } from "jest-mock-extended";
import EventDispatcherInterface from "@src/Components/EventDispatcher/Interfaces/EventDispatcherInterface";
import { AppEvents } from "@src/Types";

// Obsidian adds this to arrays at runtime; the old 3.x steps use it.
beforeAll(() => {
    (Array.prototype as unknown as { contains: unknown }).contains ??= function (this: unknown[], value: unknown) {
        return this.includes(value);
    };
});

// Settings saved by 1.0.1, with only the processor varying.
const migrate = (processor: { type: string | null; args: string[] }) => {
    const config = { version: "1.0.1", templates: { common: { main: "name", fallback: "" } }, features: {}, processor };
    return new Migrator(config as unknown as SettingsType, mock<EventDispatcherInterface<AppEvents>>()).migrate("1.0.2")
        .processor;
};

describe("1.0.2 removes the JavaScript processors", () => {
    test.each(["function", "functionV2"])("a stored %s processor is switched off", type => {
        expect(migrate({ type, args: ["return title"] })).toEqual({ type: null, args: [] });
    });

    test("a Replace processor is kept", () => {
        expect(migrate({ type: "replace", args: ["a", "g", "b"] })).toEqual({ type: "replace", args: ["a", "g", "b"] });
    });

    test("a disabled processor stays disabled", () => {
        expect(migrate({ type: null, args: [] })).toEqual({ type: null, args: [] });
    });
});
