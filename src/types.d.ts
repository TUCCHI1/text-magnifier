/**
 * Type extensions for browser APIs
 */

/**
 * Extend Document interface to include Chrome's proprietary caretRangeFromPoint
 * This API is non-standard but necessary for Chrome/Safari support
 */
interface Document {
  caretRangeFromPoint(x: number, y: number): Range | null;
}
