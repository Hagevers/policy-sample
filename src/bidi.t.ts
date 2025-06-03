declare module "bidi" {
  interface BidiOptions {
    direction?: "rtl" | "ltr";
    // Add other options as needed
  }

  export function bidi(text: string, options?: BidiOptions): string;
}
