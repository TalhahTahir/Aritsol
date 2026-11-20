// True while the first-visit preloader still covers the page.
// The heavy WebGL scenes skip drawing until then, so the intro animation gets the
// whole frame budget (the page itself is already rendered underneath).
// `is-ready` is set by the Preloader as the curtain opens, or straight away when it doesn't run.
export const pageCovered = () => !document.documentElement.classList.contains('is-ready');
