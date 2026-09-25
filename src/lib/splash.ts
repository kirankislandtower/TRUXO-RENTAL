// Timing + state for the branded splash overlay (src/app/template.tsx), shared so other pages can
// time their intro animations to it (the home hero starts revealing as the splash fades out).
export const SPLASH_HOLD_MS = 1200; // fully visible
export const SPLASH_FADE_MS = 400; // fade-out

// Browser-only state: `played` flips to true the first time the splash mounts in this tab, so client-side
// navigations skip it. It is never written on the server, so it is never shared between requests.
export const splashState = { played: false };
