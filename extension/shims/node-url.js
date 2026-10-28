// Minimal `node:url` for the browser bundle: parser.js only reads `parse(url).pathname`.
export function parse(url) {
  try {
    return new URL(url);
  } catch {
    return { pathname: String(url || '').split(/[?#]/)[0] };
  }
}

export default { parse };
