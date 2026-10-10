export namespace ReportingUtils {
  /** Single place errors are reported from. Wire Sentry in here when observability lands (brief §10). */
  export function reportError(error: unknown): void {
    if (__DEV__ && process.env.NODE_ENV !== "test") {
      console.warn(error);
    }
  }
}
