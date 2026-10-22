import ProcessorInterface from "./Interfaces";

export enum ProcessorTypes {
    Replace = "replace",
}

export type ProcessorFactory = (type: ProcessorTypes, args: string[]) => ProcessorInterface;
