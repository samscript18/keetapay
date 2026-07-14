# Keeta SDK packaging patch

`keetanetwork-keetanet-client-0.18.2-keetapay.1.tgz` contains the compiled
runtime and TypeScript declarations from the official
`@keetanetwork/keetanet-client@0.18.2` npm release.

The JavaScript, declarations, license, and runtime configuration are copied
byte-for-byte. Only package metadata is changed:

- the published `npm-shrinkwrap.json` is omitted because it installs 100+
  development and optional packages inside a runtime dependency;
- the unused optional `@google-cloud/logging` dependency is omitted;
- the Keeta ASN.1 native accelerator remains optional;
- the official `secp256k1@5.0.1` runtime dependency is unchanged.

Official tarball integrity:
`sha512-UiuNO74j7EmDGuZkWfNMDb5vnQqLIH5Y68GcTDU6KwK4ZO3DB7WKjUnQMTw1tO4nZidqizgRrT4vUaSzJ0PJPw==`

Patched tarball integrity:
`sha512-5LIDcbPoJyX2IDecAZGxfKZtDl4Jna6pFT8DjSABA80MUf8ULMzNwgFt1s++bHf/oFhBqwzqZzYzHipJT1T2sA==`

Rebuild this artifact only from the official npm tarball and verify all copied
runtime directories with `diff -qr` before packing.
