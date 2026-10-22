import { browser, expect } from "@wdio/globals";

// The settings tab is built from getSettingDefinitions() (Obsidian 1.13+): every row
// is a declarative control bound to a storage key, so these checks drive the real
// rendered controls and read the plugin's storage behind them.
const PLUGIN_ID = "meaningful-name";

const openSettings = async () => {
    await browser.executeObsidian(({ app }, id) => {
        // @ts-expect-error internal settings API
        app.setting.open();
        // @ts-expect-error internal settings API
        app.setting.openTabById(id);
    }, PLUGIN_ID);
    // The tab renders after it opens.
    await browser.waitUntil(async () => (await rows(true)).length === 6, {
        timeout: 10000,
        timeoutMsg: "the settings tab did not render",
    });
};

const closeSettings = () =>
    browser.executeObsidian(({ app }) => {
        // @ts-expect-error internal settings API
        app.setting.close();
    });

// Reads a dotted path from the live plugin storage, e.g. "processor.type".
const stored = (key: string) =>
    browser.executeObsidian(
        ({ app }, id, k) => {
            // @ts-expect-error internal plugin registry
            let node = app.plugins.plugins[id].storage;
            for (const part of k.split(".")) {
                node = node.get(part);
            }
            return node.value() as unknown;
        },
        PLUGIN_ID,
        key
    );

// Names of the visible rows in the open settings tab, optionally only headings.
const rows = (headings = false) =>
    browser.executeObsidian(({ app }, onlyHeadings) => {
        // @ts-expect-error internal settings API
        const root = app.setting.activeTab.containerEl as HTMLElement;
        const selector = onlyHeadings ? ".setting-item-heading" : ".setting-item:not(.setting-item-heading)";
        return Array.from(root.querySelectorAll<HTMLElement>(selector))
            .filter(e => e.offsetParent !== null)
            .map(e => e.querySelector(".setting-item-name")?.textContent ?? "");
    }, headings);

// Sets a row's input, select or toggle the way a user would, firing input and change.
const change = (name: string, value: string | boolean) =>
    browser.executeObsidian(
        ({ app }, n, v) => {
            // @ts-expect-error internal settings API
            const root = app.setting.activeTab.containerEl as HTMLElement;
            const row = Array.from(root.querySelectorAll<HTMLElement>(".setting-item:not(.setting-item-heading)")).find(
                e => e.offsetParent !== null && e.querySelector(".setting-item-name")?.textContent === n
            );
            const control = row?.querySelector<HTMLInputElement | HTMLSelectElement>("input, select, textarea");
            if (!control) {
                throw new Error(`No visible control named "${n}"`);
            }
            if (typeof v === "boolean") {
                if ((control as HTMLInputElement).checked !== v) {
                    control.click();
                }
                return;
            }
            control.value = v;
            control.dispatchEvent(new Event("input", { bubbles: true }));
            control.dispatchEvent(new Event("change", { bubbles: true }));
        },
        name,
        value
    );

describe("Meaningful Name — declarative settings tab", function () {
    before(async function () {
        // Let the plugin finish booting, and close the "what's new" notice if it is open.
        await browser.pause(6000);
        await browser.keys("Escape");
        await openSettings();
    });

    after(async function () {
        await closeSettings();
    });

    it("renders its groups from getSettingDefinitions()", async function () {
        expect(await rows(true)).toEqual(["Templates", "Processor", "Rules", "Features", "Feature settings", "Util"]);
        const items = await browser.executeObsidian(({ app }) => {
            // @ts-expect-error internal settings API
            return (app.setting.activeTab.settingItems as unknown[]).length;
        });
        expect(items).toBe(6);
    });

    it("offers only the Replace processor, and shows its fields when selected", async function () {
        const options = await browser.executeObsidian(({ app }) => {
            // @ts-expect-error internal settings API
            const root = app.setting.activeTab.containerEl as HTMLElement;
            const row = Array.from(root.querySelectorAll(".setting-item:not(.setting-item-heading)")).find(
                e => e.querySelector(".setting-item-name")?.textContent === "Processor"
            );
            return Array.from(row.querySelectorAll("select:not(.is-measuring) option")).map(o => o.textContent);
        });
        expect(options).toEqual(["Disabled", "Replace"]);
        expect(await rows()).not.toContain("Pattern");

        await change("Processor", "replace");
        await browser.waitUntil(async () => (await stored("processor.type")) === "replace");
        await browser.waitUntil(async () => (await rows()).includes("Pattern"));

        await change("Pattern", "Hello");
        await browser.waitUntil(async () => ((await stored("processor.args")) as string[])[0] === "Hello");

        await change("Processor", "");
        await browser.waitUntil(async () => (await stored("processor.type")) === null);
        await browser.waitUntil(async () => !(await rows()).includes("Pattern"));
    });

    it("shows a feature's page only while the feature is on", async function () {
        const pages = async () =>
            browser.executeObsidian(({ app }) => {
                // @ts-expect-error internal settings API
                const root = app.setting.activeTab.containerEl as HTMLElement;
                return Array.from(root.querySelectorAll<HTMLElement>(".setting-item.mod-navigable"))
                    .filter(e => e.offsetParent !== null)
                    .map(e => e.querySelector(".setting-item-name")?.textContent ?? "");
            });
        const initial = (await stored("features.alias.enabled")) as boolean;
        expect((await pages()).includes("Alias")).toBe(initial);

        await change("Alias", !initial);
        await browser.waitUntil(async () => (await stored("features.alias.enabled")) === !initial);
        await browser.waitUntil(async () => (await pages()).includes("Alias") === !initial);

        await change("Alias", initial);
        await browser.waitUntil(async () => (await stored("features.alias.enabled")) === initial);
    });

    it("opens a feature page with its own options and templates", async function () {
        const initial = (await stored("features.explorer.enabled")) as boolean;
        await change("Explorer", true);
        await browser.executeObsidian(({ app }) => {
            // @ts-expect-error internal settings API
            const root = app.setting.activeTab.containerEl as HTMLElement;
            Array.from(root.querySelectorAll<HTMLElement>(".setting-item.mod-navigable"))
                .find(e => e.querySelector(".setting-item-name")?.textContent === "Explorer")
                ?.click();
        });
        // Settings open in their own window, so the page is read from the settings object.
        const page = () =>
            browser.executeObsidian(({ app }) => {
                // @ts-expect-error internal settings API
                const el = app.setting.getCurrentPageEl() as HTMLElement | null;
                return Array.from(el?.querySelectorAll(".setting-item-name") ?? []).map(e => e.textContent);
            });
        await browser.waitUntil(
            async () => {
                const names = await page();
                return ["Sort", "Main", "Fallback"].every(n => names.includes(n));
            },
            { timeout: 10000, timeoutMsg: "Explorer page did not show Sort, Main and Fallback" }
        );

        await browser.executeObsidian(({ app }) => {
            // @ts-expect-error internal settings API
            app.setting.closePage();
        });
        await browser.waitUntil(async () => (await rows(true)).length === 6, { timeout: 10000 });
        await change("Explorer", initial);
    });

    it("saves changes when the settings tab closes", async function () {
        const original = (await stored("templates.common.fallback")) as string | null;
        await change("Common fallback template", "e2e_fallback");
        await browser.waitUntil(async () => (await stored("templates.common.fallback")) === "e2e_fallback");
        await closeSettings();

        const saved = () =>
            browser.executeObsidian(async ({ app }, id) => {
                const raw = await app.vault.adapter.read(`${app.vault.configDir}/plugins/${id}/data.json`);
                return (JSON.parse(raw) as { templates: { common: { fallback: string } } }).templates.common.fallback;
            }, PLUGIN_ID);
        await browser.waitUntil(async () => (await saved()) === "e2e_fallback", {
            timeout: 10000,
            timeoutMsg: "the changed template was not saved to data.json",
        });

        await openSettings();
        await change("Common fallback template", original ?? "");
        await closeSettings();
        await browser.waitUntil(async () => (await saved()) === (original ?? ""), { timeout: 10000 });
        await openSettings();
    });
});
