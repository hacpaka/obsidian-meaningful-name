import { TestEnvironment } from "jest-environment-node";

// The unit suite runs in Node, but the plugin calls the timer functions through `window`
// (Obsidian requires it so timers belong to the popout window they were started in).
// `window` is the sandbox's own global object, so those calls hit the very same timer
// functions the tests spy on and fake.
export default class Environment extends TestEnvironment {
    async setup(): Promise<void> {
        await super.setup();
        (this.global as { window?: unknown }).window = this.global;
    }
}
