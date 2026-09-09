# Vendored browser dependencies

`supabase-2.115.0.js` is the official UMD browser bundle from npm package `@supabase/supabase-js@2.115.0`.

It is intentionally served from this GitHub Pages origin so the login page does not execute authentication code from a third-party CDN at runtime.

To upgrade it, change `VERSION` in `.github/workflows/vendor-supabase.yml` and run the workflow.
