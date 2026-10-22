import { browser, expect } from "@wdio/globals";

const RELOAD = "meaningful-name:omn-features-reload";

// The error collector this spec installs on the renderer's window.
type Collector = { __omnErrs: string[]; __omnOrigErr: (...args: unknown[]) => void };

// T11 — verify the plugin produces no errors while (re)initialising all features.
// Reload + view switching exercises the same paths as #247 ("TypeError ...
// isVisible") and #232 ("error if explorer not active view at start").
// We hook console.error (the plugin's hardening + .catch(console.error) paths all
// go through it) and assert nothing plugin-related fires.
describe("Meaningful Name — no errors during feature (re)init (#247, #232)", function () {
    it("re-initialises all features cleanly, starting from a non-explorer view", async function () {
        // Install the error collector.
        await browser.execute(() => {
            const w = window as unknown as Collector;
            w.__omnErrs = [];
            const orig = console.error.bind(console);
            w.__omnOrigErr = orig;
            console.error = (...args: unknown[]) => {
                try {
                    w.__omnErrs.push(args.map(a => (a as { stack?: string })?.stack || String(a)).join(" "));
                } catch {
                    /* ignore */
                }
                orig(...args);
            };
        });

        // #232/#245 path: make a non-explorer view active, then reload features.
        await browser.executeObsidianCommand("global-search:open");
        await browser.pause(500);
        await browser.executeObsidianCommand(RELOAD);
        await browser.pause(1500);
        // Now bring the explorer back and reload again.
        await browser.executeObsidianCommand("file-explorer:open");
        await browser.executeObsidianCommand(RELOAD);
        await browser.pause(2000);

        const errs: string[] = await browser.execute(() => (window as unknown as Partial<Collector>).__omnErrs ?? []);
        // eslint-disable-next-line no-console
        console.log("INIT ERRS >>>", JSON.stringify(errs.slice(0, 20), null, 2));

        const bad = errs.filter(e => {
            const m = e.toLowerCase();
            return (
                m.includes("meaningful-name") ||
                m.includes("isvisible") ||
                m.includes("cannot read properties") ||
                m.includes("explorerviewundefined") ||
                m.includes("is not a function")
            );
        });
        expect(bad).toEqual([]);
    });
});
