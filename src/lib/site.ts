// Social and partner links in one place.
export const SOCIAL = {
  x: "https://x.com/bchdotnow",
  xHandle: "@bchdotnow",
  github: "https://github.com/bchdotnow/bchdotnow",
};

export const PARTNER = {
  name: "SideShift",
  url: "https://sideshift.ai",
  support: "https://help.sideshift.ai",
};

// The commit this build was made from, linked in the footer. Empty in local development.
export const COMMIT = process.env.NEXT_PUBLIC_COMMIT || "";
export const SOURCE_URL = COMMIT ? `${SOCIAL.github}/tree/${COMMIT}` : SOCIAL.github;
// Copyright year, fixed at build time (the page is prerendered, so it can't read the clock while rendering).
export const BUILD_YEAR = process.env.NEXT_PUBLIC_BUILD_YEAR || "";
