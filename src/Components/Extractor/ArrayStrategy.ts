import StrategyInterface from "@src/Components/Extractor/Interfaces/StrategyInterface";
import { inject, injectable } from "inversify";
import SI from "@config/inversify.types";

@injectable()
export default class ArrayStrategy implements StrategyInterface {
    constructor(
        @inject(SI["getter:delimiter"])
        private delimiterGetter: () => { enabled: boolean; value: string }
    ) {}

    process(v: (string | number)[]): string | null {
        if (v.length === 0) {
            return null;
        }
        const delimiter = this.delimiterGetter();
        return !delimiter.enabled ? (v[0] as string) : v.join(delimiter.value);
    }

    support(type: string): boolean {
        return type === "array";
    }
}
