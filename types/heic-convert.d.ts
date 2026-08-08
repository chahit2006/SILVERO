// heic-convert ships no type declarations and @types/heic-convert doesn't
// exist — minimal shape covering the single call we make (lib/image-upload.ts).
declare module "heic-convert" {
  type ConvertInput = {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convert(input: ConvertInput): Promise<Buffer>;

  export = convert;
}
