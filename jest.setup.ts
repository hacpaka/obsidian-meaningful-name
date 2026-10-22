import "reflect-metadata";

// The unit suite runs in the node environment, but the plugin calls the timer
// functions through `window` (Obsidian requires it so timers belong to the popout
// window they were started in). Alias `window` to Node's `global` so those calls hit
// the very same timer functions the tests spy on and fake.
(global as unknown as { window: typeof global }).window ??= global;
