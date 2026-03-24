// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `project.json`.

console.log("Environment config - NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

export const environment = {
  production: false,
  staging: false,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://zo.xyz/ops-backend",
};

console.log("Environment config - Final apiUrl:", environment.apiUrl);
