import { initializeApp } from "firebase/app";
import { initializeFirestore, writeBatch, doc } from "firebase/firestore";
import {
  INITIAL_INVENTORY,
  INITIAL_LEDGER,
  INITIAL_CUSTOMER_ISSUANCES,
  INITIAL_TRANSFERS,
} from "../src/services/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDVfGttgp9uQogKTDBYzUknokJoXH-NZcs",
  authDomain: "slt-matrix.firebaseapp.com",
  projectId: "slt-matrix",
  storageBucket: "slt-matrix.firebasestorage.app",
  messagingSenderId: "596272385139",
  appId: "1:596272385139:web:70df813556016361632e06",
  measurementId: "G-ZJS6SW6MM5",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

const clean = (item: any) => JSON.parse(JSON.stringify(item));

async function batchPush(colName: string, items: any[]) {
  const BATCH_SIZE = 400;
  console.log(`Pushing ${items.length} items to collection '${colName}'...`);
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const item of chunk) {
      const docRef = doc(db, colName, item.id);
      batch.set(docRef, clean(item));
    }
    await batch.commit();
    console.log(`  -> Committed batch ${i + 1}..${Math.min(i + BATCH_SIZE, items.length)} for ${colName}`);
  }
}

async function main() {
  try {
    console.log("=== SLT MatriX Firestore Seeder ===");
    await batchPush("inventory", INITIAL_INVENTORY);
    await batchPush("ledger", INITIAL_LEDGER);
    await batchPush("customerIssuances", INITIAL_CUSTOMER_ISSUANCES);
    await batchPush("transfers", INITIAL_TRANSFERS);
    console.log("🎉 ALL DATA SEEDED SUCCESSFULLY TO FIRESTORE!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

main();
