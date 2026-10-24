import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import type {
  InventoryItem,
  LedgerTransaction,
  CustomerIssuance,
  StockTransfer,
  UserPersona,
} from "../types/inventory";

/* -------------------------------------------------------------------
   Firestore Collection Names
------------------------------------------------------------------- */
export const COLLECTIONS = {
  INVENTORY: "inventory",
  LEDGER: "ledger",
  CUSTOMER_ISSUANCES: "customerIssuances",
  TRANSFERS: "transfers",
  USERS: "users",
} as const;

// Maximum batch size in Firestore is 500, we use 400 for safety margin
const BATCH_SIZE = 400;

// Helper to remove any undefined properties from objects before Firestore write
const cleanDoc = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/* -------------------------------------------------------------------
   INVENTORY  –  Firestore CRUD
------------------------------------------------------------------- */
export const pushInventoryToFirestore = async (items: InventoryItem[]) => {
  if (!items || items.length === 0) return;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const item of chunk) {
      const docRef = doc(db, COLLECTIONS.INVENTORY, item.id);
      batch.set(docRef, cleanDoc(item));
    }
    await batch.commit();
  }
  console.log(`[Firestore] Pushed ${items.length} inventory items.`);
};

export const pushSingleInventoryItem = async (item: InventoryItem) => {
  const docRef = doc(db, COLLECTIONS.INVENTORY, item.id);
  await setDoc(docRef, cleanDoc(item), { merge: true });
};

export const deleteSingleInventoryItem = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.INVENTORY, id);
  await deleteDoc(docRef);
};

export const fetchInventoryFromFirestore = async (): Promise<InventoryItem[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.INVENTORY));
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as InventoryItem));
};

/* -------------------------------------------------------------------
   LEDGER  –  Firestore CRUD
------------------------------------------------------------------- */
export const pushLedgerToFirestore = async (transactions: LedgerTransaction[]) => {
  if (!transactions || transactions.length === 0) return;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const chunk = transactions.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const tx of chunk) {
      const docRef = doc(db, COLLECTIONS.LEDGER, tx.id);
      batch.set(docRef, cleanDoc(tx));
    }
    await batch.commit();
  }
  console.log(`[Firestore] Pushed ${transactions.length} ledger transactions.`);
};

export const pushSingleLedgerEntry = async (tx: LedgerTransaction) => {
  const docRef = doc(db, COLLECTIONS.LEDGER, tx.id);
  await setDoc(docRef, cleanDoc(tx));
};

export const fetchLedgerFromFirestore = async (): Promise<LedgerTransaction[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.LEDGER));
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as LedgerTransaction));
};

/* -------------------------------------------------------------------
   CUSTOMER ISSUANCES  –  Firestore CRUD
------------------------------------------------------------------- */
export const pushIssuancesToFirestore = async (issuances: CustomerIssuance[]) => {
  if (!issuances || issuances.length === 0) return;
  for (let i = 0; i < issuances.length; i += BATCH_SIZE) {
    const chunk = issuances.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const iss of chunk) {
      const docRef = doc(db, COLLECTIONS.CUSTOMER_ISSUANCES, iss.id);
      batch.set(docRef, cleanDoc(iss));
    }
    await batch.commit();
  }
  console.log(`[Firestore] Pushed ${issuances.length} customer issuances.`);
};

export const pushSingleIssuance = async (issuance: CustomerIssuance) => {
  const docRef = doc(db, COLLECTIONS.CUSTOMER_ISSUANCES, issuance.id);
  await setDoc(docRef, cleanDoc(issuance), { merge: true });
};

export const fetchIssuancesFromFirestore = async (): Promise<CustomerIssuance[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMER_ISSUANCES));
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as CustomerIssuance));
};

/* -------------------------------------------------------------------
   STOCK TRANSFERS  –  Firestore CRUD
------------------------------------------------------------------- */
export const pushTransfersToFirestore = async (transfers: StockTransfer[]) => {
  if (!transfers || transfers.length === 0) return;
  for (let i = 0; i < transfers.length; i += BATCH_SIZE) {
    const chunk = transfers.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const t of chunk) {
      const docRef = doc(db, COLLECTIONS.TRANSFERS, t.id);
      batch.set(docRef, cleanDoc(t));
    }
    await batch.commit();
  }
  console.log(`[Firestore] Pushed ${transfers.length} stock transfers.`);
};

export const pushSingleTransfer = async (transfer: StockTransfer) => {
  const docRef = doc(db, COLLECTIONS.TRANSFERS, transfer.id);
  await setDoc(docRef, cleanDoc(transfer), { merge: true });
};

export const fetchTransfersFromFirestore = async (): Promise<StockTransfer[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSFERS));
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as StockTransfer));
};

/* -------------------------------------------------------------------
   USERS  –  Firestore CRUD & Real-Time Sync
------------------------------------------------------------------- */
export const pushUsersToFirestore = async (users: UserPersona[]) => {
  if (!users || users.length === 0) return;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const chunk = users.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const u of chunk) {
      const docRef = doc(db, COLLECTIONS.USERS, u.id);
      batch.set(docRef, cleanDoc(u), { merge: true });
    }
    await batch.commit();
  }
};

export const pushSingleUser = async (user: UserPersona) => {
  const docRef = doc(db, COLLECTIONS.USERS, user.id);
  await setDoc(docRef, cleanDoc(user), { merge: true });
};

export const deleteSingleUser = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.USERS, id);
  await deleteDoc(docRef);
};

export const fetchUsersFromFirestore = async (): Promise<UserPersona[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as UserPersona));
};

/* -------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS (Firestore onSnapshot Live Streams)
   Automatically updates all connected clients when ANY user updates data.
------------------------------------------------------------------- */
export const subscribeToInventory = (callback: (items: InventoryItem[]) => void): (() => void) => {
  const colRef = collection(db, COLLECTIONS.INVENTORY);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as InventoryItem));
      callback(items);
    },
    (err) => {
      console.warn("[Firestore] Real-time inventory sync warning:", err);
    }
  );
};

export const subscribeToLedger = (callback: (transactions: LedgerTransaction[]) => void): (() => void) => {
  const colRef = collection(db, COLLECTIONS.LEDGER);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const txs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as LedgerTransaction));
      txs.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      callback(txs);
    },
    (err) => {
      console.warn("[Firestore] Real-time ledger sync warning:", err);
    }
  );
};

export const subscribeToUsers = (callback: (users: UserPersona[]) => void): (() => void) => {
  const colRef = collection(db, COLLECTIONS.USERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const users = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as UserPersona));
      callback(users);
    },
    (err) => {
      console.warn("[Firestore] Real-time users sync warning:", err);
    }
  );
};

export const subscribeToCustomerIssuances = (callback: (issuances: CustomerIssuance[]) => void): (() => void) => {
  const colRef = collection(db, COLLECTIONS.CUSTOMER_ISSUANCES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const issuances = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as CustomerIssuance));
      callback(issuances);
    },
    (err) => {
      console.warn("[Firestore] Real-time issuances sync warning:", err);
    }
  );
};

export const subscribeToTransfers = (callback: (transfers: StockTransfer[]) => void): (() => void) => {
  const colRef = collection(db, COLLECTIONS.TRANSFERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const transfers = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as StockTransfer));
      callback(transfers);
    },
    (err) => {
      console.warn("[Firestore] Real-time transfers sync warning:", err);
    }
  );
};

/* -------------------------------------------------------------------
   FULL SYNC  –  Push ALL data to Firestore
------------------------------------------------------------------- */
export const pushAllDataToFirestore = async (data: {
  inventory: InventoryItem[];
  ledger: LedgerTransaction[];
  customerIssuances: CustomerIssuance[];
  transfers: StockTransfer[];
  users?: UserPersona[];
}): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("[Firestore] Starting full real-time data sync...");

    const tasks: Promise<any>[] = [
      pushInventoryToFirestore(data.inventory),
      pushLedgerToFirestore(data.ledger),
      pushIssuancesToFirestore(data.customerIssuances),
      pushTransfersToFirestore(data.transfers),
    ];

    if (data.users && data.users.length > 0) {
      tasks.push(pushUsersToFirestore(data.users));
    }

    await Promise.all(tasks);

    console.log("[Firestore] ✅ Full data sync complete!");
    return { success: true };
  } catch (err: any) {
    console.error("[Firestore] ❌ Full sync failed:", err);
    return { success: false, error: err.message || String(err) };
  }
};
