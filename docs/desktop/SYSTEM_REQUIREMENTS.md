# Proposed requirements and benchmark procedure

These requirements are proposals, not published measured guarantees. Initial release target is Windows x64. Windows 10 22H2 compatibility depends on the pinned Electron/Chromium and dependencies; Windows 11 is also a target. Actual installation, GPU, WebRTC, updater and driver tests remain mandatory. Windows ARM64 is a future evaluation; no 32-bit artifact is configured.

| | Minimum proposed complete feature experience | Recommended |
|---|---|---|
| OS | Windows 10 22H2 x64 compatibility target; Windows 11 x64 | Windows 11 x64 |
| CPU | 64-bit dual-core | Core i5 / Ryzen 5, quad-core or better |
| RAM | 8 GB recommended minimum for complete features | 16 GB |
| Storage | 1 GB free for initial install and update headroom | SSD; at least 2 GB free |
| Display | 1280 × 720 | 1920 × 1080 |
| Graphics | Integrated; software fallback must be tested | Hardware acceleration available |
| Network | Broadband | Stable broadband |

4 GB machines are never denied basic messaging solely by a hardware check. Automatic mode reduces animations/effects on machines below 9 GiB or with at most two logical CPUs; manual economy/balanced overrides are available. Hardware acceleration defaults on and can be disabled after a graphics issue; Chromium provides supported fallback. There is one application renderer, with a temporary picker renderer only during source selection. LiveKit, encryption workers, settings and shell code are lazy loaded. Existing thumbnails, lazy images, metadata-only video preload, track stopping and selective screen-share subscriptions are preserved. Hardware acceleration and CPU thresholds are heuristics, not performance promises.

Temporary Chromium cache budgets are configurable at 128/256/512 MB and apply on restart. Cache clearing removes Chromium temporary cache and the old media Cache API namespace; it never clears accounts, history, tokens, encryption keys or preferences. Current product policy disables persistent attachment Cache API retention; desktop preserves it. A cache budget is a Chromium hint, not a hard filesystem quota.

## Required physical Windows benchmark matrix

| Configuration | Startup | Idle RAM / CPU | Messaging | Files | Calls | Screen sharing | Result |
|---|---|---|---|---|---|---|---|
| 8 GB, dual-core, integrated GPU | Pending | Pending | Pending | Pending | Pending | Pending | Not tested |
| 16 GB, i5/Ryzen 5, integrated GPU | Pending | Pending | Pending | Pending | Pending | Pending | Not tested |
| 16–32 GB, dedicated / modern integrated GPU | Pending | Pending | Pending | Pending | Pending | Pending | Not tested |

Also test 4 GB basic messaging, missing microphone/camera/output, disabled acceleration and unplugging each device mid-call. Windows CI VM measurements are useful diagnostics but do not substitute for these machines.

On each machine record OS build, CPU model/core count, physical RAM, GPU/driver, disk, power mode, display/scaling, app version/commit/channel, network RTT/throughput, backend version and workload. Use at least five cold and five warm launches, separating OS filesystem cache and Playwright overhead. Record median and p95, total process working set/private bytes and CPU over five minutes, not only one renderer.

Messaging: authenticated send/receive and scrolling in a fixed known history, concurrent conversations and Android/web synchronization. Files: image orientation/metadata/WebP, video/documents, small/multiple files and files up to server-reported limits; hash downloads, cancel/retry/interruption. Calls: 1:1 and group, voice/video, reconnect and device changes for 30 minutes. Screen sharing: each monitor/window, audio, quality/fps, stop and unplug. Long sessions: 8 hours including sleep/resume and network loss. Record every failure and actual media transmission.

`npm run benchmark` records a narrow signed-out shell startup and idle process snapshot in `benchmarks/results`. Its report explicitly labels unmeasured scenarios. Do not publish final system requirements based on that script alone. Raw host measurements and limitations are in TEST_REPORT.md.
