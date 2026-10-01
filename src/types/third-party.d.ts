// The parts of the CookieScript and tawk.to browser APIs this app uses.
// CookieScript: https://help.cookie-script.com/en/javascript-code-documentation/custom-functions

type CookieScriptCategory = "strict" | "performance" | "targeting" | "functionality" | "unclassified";

interface CookieScriptInstance {
  show(): void;
  currentState(): { action?: "accept" | "reject"; categories?: CookieScriptCategory[] };
  acceptAction(categories: CookieScriptCategory[]): void;
  applyTranslationByCode(code: string): void;
}

interface TawkApi {
  onLoad?: () => void;
  showWidget?: () => void;
  hideWidget?: () => void;
  maximize?: () => void;
  setAttributes?: (attributes: Record<string, string>, callback?: (error?: unknown) => void) => void;
}

interface Window {
  CookieScript?: { instance?: CookieScriptInstance };
  Tawk_API?: TawkApi;
  Tawk_LoadStart?: Date;
}
