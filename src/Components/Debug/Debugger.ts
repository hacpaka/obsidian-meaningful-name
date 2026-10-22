import LoggerInterface from "@src/Components/Debug/LoggerInterface";
import { injectable } from "inversify";

@injectable()
export default class Debugger implements LoggerInterface {
    constructor(private name: string, private enabled: () => boolean) {}

    info(...value: unknown[]): void {
        this.log(...value);
    }
    debug(...value: unknown[]): void {
        this.log(...value);
    }
    warn(...value: unknown[]): void {
        this.log(...value);
    }

    log(...value: unknown[]) {
        if (this.enabled()) {
            console.debug(`[${this.name}]`, ...value);
        }
    }
}
