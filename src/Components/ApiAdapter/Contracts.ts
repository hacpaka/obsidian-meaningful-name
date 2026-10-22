/*
 * API contracts, copied from front-matter-plugin-api-provider 0.1.4-alpha
 * (https://github.com/snezhig/front-matter-plugin-api-provider, commit 503327a) so the plugin
 * builds and type-checks without that repository as a git submodule.
 *
 * Copyright (c) snezhig
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without
 * fee is hereby granted, provided that the above copyright notice and this permission notice appear
 * in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
 * SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
 * AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 * NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
 * OF THIS SOFTWARE.
 */

export interface PluginInterface {
    getDefer(): DeferInterface;
}

export interface ApiInterface {
    getResolverFactory(): ResolverFactory | null;
    getEventDispatcher(): EventDispatcherInterface<Events> | null;
    getEnabledFeatures(): string[];
}

export interface DeferInterface {
    getApi(): ApiInterface | null;

    isPluginReady(): boolean;

    awaitPlugin(): Promise<void>;

    isFeaturesReady(): boolean;

    awaitFeatures(): Promise<void>;
}

export interface EventInterface<T> {
    get(): T;

    stop(): void;
}

export interface ListenerRef<T> {
    getName(): T;
}

export type Callback<T> = (e: T extends undefined | null ? undefined : EventInterface<T>) => void;

export type Listener<E, T extends keyof E> = {
    name: T;
    cb: Callback<E[T]>;
    sort?: number;
    once?: boolean;
};

export interface EventDispatcherInterface<E> {
    addListener<T extends keyof E>(listener: Listener<E, T>): ListenerRef<T>;

    removeListener<T extends keyof E>(ref: ListenerRef<T>): void;

    dispatch<T extends keyof E>(name: T, e: E[T] extends undefined | null ? undefined : EventInterface<E[T]>): void;
}

export type Events = {
    "manager:update": { id: string; result: boolean; path: string };
};

export interface ResolverInterface {
    resolve(path: string): string | null;
}

export interface ResolverFactory {
    createResolver(feature: string): ResolverInterface;
}
