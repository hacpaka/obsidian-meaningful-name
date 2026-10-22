export default interface LoggerInterface {
    log(...value: unknown[]): void;
    info(...value: unknown[]): void;
    debug(...value: unknown[]): void;
    warn(...value: unknown[]): void;
}
