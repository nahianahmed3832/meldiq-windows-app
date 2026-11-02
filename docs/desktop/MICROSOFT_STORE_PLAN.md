# Microsoft Store and future platforms

Store submission is not ready. First complete signed Windows direct-distribution acceptance. For MSIX, obtain the Partner Center identity/publisher and use a separate Store packaging configuration around the same locally built application. Build information must set distribution=store; native updater remains disabled. Store updates manage that installation. Do not infer installation source solely from a registry string; use packaged identity/build source and verified migration tests.

Evaluate the Store's current EXE/MSI submission option separately: it requires a complete offline versioned installer and can retain the app updater where the current policy permits. Confirm policies and identity with Partner Center at submission time. No second account system, billing records or renderer rewrite is needed. Test existing browser payment flows and Store commerce policy before submission.

Migration must find existing installation scope/channel and app identity, request intentional replacement, preserve user data, unregister old protocol/startup hooks only when owned, and avoid simultaneous conflicting direct/Store app registrations. No automated destructive migration is included in this preview.

Prepared builder targets for macOS DMG and Linux AppImage/DEB are architectural preparation only. macOS needs actual Developer ID signing, hardened runtime/notarization, camera/microphone descriptions and OS screen-recording approval. Linux needs a supported secret-service backend (basic_text is rejected), PipeWire/portal screen sharing and distribution-specific updater verification. Current native updater is Windows-only. Windows ARM64, macOS and Linux require their own CI, driver, permissions and hardware tests before distribution.
