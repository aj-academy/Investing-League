# V10 (disabled)

V10 permission-tier logic lives in this folder but is **not used** in the scan pipeline.
Production scans run **V8 → V9** only.

To re-enable later, wire `applyV10Layers` in `app/api/signals/scan/route.ts` and set `V10_ENABLED` in `enabled.ts`.
