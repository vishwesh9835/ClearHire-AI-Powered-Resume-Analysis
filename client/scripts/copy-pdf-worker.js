/**
 * Vendors the pdf.js Web Worker into `client/public` so the browser loads it
 * from our own origin instead of a third-party CDN.
 *
 * Why this is required (not just an optimisation):
 *   pdf.js parses PDFs inside a Web Worker. Its loader does:
 *
 *     if (!isSameOrigin(window.location, workerSrc)) {
 *       workerSrc = PDFWorker._createCDNWrapper(...);   // -> blob: URL
 *     }
 *     const worker = new Worker(workerSrc, { type: "module" });
 *
 *   A cross-origin worker therefore becomes a `blob:` URL that `import`s the
 *   remote script. Our Content-Security-Policy (helmet defaults, which send
 *   `default-src 'self'` and no `worker-src` / `script-src` exceptions) blocks
 *   BOTH the blob worker and the remote import, so PDF upload fails in any
 *   production deployment while working fine on the CRA dev server.
 *
 *   Once the worker is same-origin the CDN wrapper is skipped entirely, the
 *   strict CSP is satisfied, and the app no longer depends on unpkg.com being
 *   reachable at runtime.
 *
 * Runs automatically via the `prestart` and `prebuild` hooks in
 * client/package.json, so the vendored file can never drift from the installed
 * pdfjs-dist version.
 */

const fs = require("fs");
const path = require("path");

const clientRoot = path.join(__dirname, "..");
const pdfjsDir = path.join(clientRoot, "node_modules", "pdfjs-dist");
const source = path.join(pdfjsDir, "build", "pdf.worker.min.mjs");
const destination = path.join(clientRoot, "public", "pdf.worker.min.mjs");

function fail(message) {
  console.error(`\n[copy-pdf-worker] ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(source)) {
  fail(
    `Could not find pdf.js worker at ${source}.\n` +
      "  Run `npm install` in client/ so pdfjs-dist is present before building."
  );
}

const { version } = JSON.parse(
  fs.readFileSync(path.join(pdfjsDir, "package.json"), "utf8")
);

const worker = fs.readFileSync(source);

// Guard against a future pdf.js release splitting the worker into chunks:
// a module worker that imports siblings would break once copied on its own.
if (/^\s*import\s|^\s*export\s/m.test(worker.toString("utf8"))) {
  console.warn(
    "[copy-pdf-worker] Warning: the pdf.js worker contains top-level " +
      "import/export statements. Verify it still loads as a standalone " +
      "module worker after vendoring."
  );
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, worker);

const kilobytes = Math.round(worker.length / 1024);
console.log(
  `[copy-pdf-worker] Vendored pdf.worker.min.mjs (pdfjs-dist ${version}, ${kilobytes} kB) -> public/`
);
