import {Returns} from "@tsed/schema";

/**
 * Sets the Content-Type HTTP header to the MIME type as determined by mime.lookup() for the specified type.
 * If type contains the “/” character, then it sets the `Content-Type` to type.
 *
 * ```typescript
 *  @ContentType('.html');              // => 'text/html'
 *  @ContentType('html');               // => 'text/html'
 *  @ContentType('json');               // => 'application/json'
 *  @ContentType('application/json');   // => 'application/json'
 *  @ContentType('png');                // => image/png
 *  private myMethod() {}
 * ```
 *
 * @param type
 * @decorator
 * @operation
 * @response
 * @headers
 * @deprecated Since v6. Use @Returns().ContentType() instead.
 */
export function ContentType(type: string) {
  return Returns().ContentType(type);
}
