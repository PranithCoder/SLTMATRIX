import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["scripts/seedRunner.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "scripts/seedRunner.mjs",
  external: ["firebase", "firebase/*"],
  define: {
    "import.meta.env": JSON.stringify({
      VITE_FIREBASE_API_KEY: "AIzaSyDVfGttgp9uQogKTDBYzUknokJoXH-NZcs",
      VITE_FIREBASE_AUTH_DOMAIN: "slt-matrix.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "slt-matrix",
      VITE_FIREBASE_STORAGE_BUCKET: "slt-matrix.firebasestorage.app",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "596272385139",
      VITE_FIREBASE_APP_ID: "1:596272385139:web:70df813556016361632e06",
      VITE_FIREBASE_MEASUREMENT_ID: "G-ZJS6SW6MM5"
    })
  }
});

console.log("Seed runner built successfully!");
