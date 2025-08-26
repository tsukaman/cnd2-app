// BarcodeDetector API TypeScript definitions
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector

interface BarcodeDetectorOptions {
  formats?: BarcodeFormat[];
}

type BarcodeFormat = 
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e'
  | 'unknown';

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
  format: BarcodeFormat;
  rawValue: string;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<BarcodeFormat[]>;
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}

// NFC API TypeScript definitions
interface NDEFReaderOptions {
  signal?: AbortSignal;
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView;
  encoding?: string;
  lang?: string;
}

interface NDEFMessage {
  records: ReadonlyArray<NDEFRecord>;
}

interface NDEFReadingEvent extends Event {
  message: NDEFMessage;
  serialNumber?: string;
}

declare class NDEFReader extends EventTarget {
  constructor();
  scan(options?: NDEFReaderOptions): Promise<void>;
  write(message: NDEFMessage | string, options?: NDEFReaderOptions): Promise<void>;
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
}

interface Window {
  NDEFReader?: typeof NDEFReader;
}