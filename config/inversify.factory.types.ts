import { MetadataCache, Modal, TFile } from "obsidian";
import FunctionReplacer, { FunctionPropertyNames, Implementation } from "@src/Utils/FunctionReplacer";

export type ObsidianFileFactory<T = unknown> = (path: string) => T;
export type ObsidianMetaFactory<T = unknown> = (path: string, type: "frontmatter" | "headings") => T;
export type MetadataCacheFactory<T extends MetadataCache> = () => T;
export type ObsidianActiveFile = () => TFile | null;
export type FunctionReplacerFactory<Target, Method extends FunctionPropertyNames<Required<Target>>, O> = (
    target: Target,
    method: Method,
    args: O,
    implementation: Implementation<Target, Method, O>
) => FunctionReplacer<Target, Method, O> | null;
export type ObsidianModalFactory = () => Modal;
