export type MainCategory = 'New Connection' | 'Rehabilitation';

export type SubCategoryCode = 
  | 'TCOPNC'     // Standard New Connection Material / Devices
  | 'TCOPNC-C'   // Collective Stock (Direct Collection from Customer)
  | 'TCOPNC-R'   // Workshop Returns (Returned from Workshop / Repair Center)
  | 'TC-OPCDR'   // New Material Incoming for Rehab Projects
  | 'TC-OPCDR-R'; // Returned Material from Rehab Sites

export interface SubCategoryMeta {
  code: SubCategoryCode;
  mainCategory: MainCategory;
  name: string;
  description: string;
  defaultBehavior: string;
  badgeColor: string;
}

export const SUB_CATEGORY_METADATA: Record<SubCategoryCode, SubCategoryMeta> = {
  'TCOPNC': {
    code: 'TCOPNC',
    mainCategory: 'New Connection',
    name: 'Standard New Connection (TC-OPNC)',
    description: 'Standard New Connection Material / Devices for customer premise installations.',
    defaultBehavior: 'Stock Decrease (-) upon allocation to Customer Account',
    badgeColor: '#0056B3', // SLT Deep Blue
  },
  'TCOPNC-C': {
    code: 'TCOPNC-C',
    mainCategory: 'New Connection',
    name: 'Collective Stock (TC-OPNC-C)',
    description: 'Equipment and materials collected directly from customer premises (churn, disconnections, fault replacement).',
    defaultBehavior: 'Stock Increase (+) ONLY — Direct collection from customer premises into collective stock',
    badgeColor: '#6B21A8', // Purple
  },
  'TCOPNC-R': {
    code: 'TCOPNC-R',
    mainCategory: 'New Connection',
    name: 'Workshop Returns (TC-OPNC-R)',
    description: 'Equipment and materials returned from Central Repair Centers / Workshops to depot stock.',
    defaultBehavior: 'Stock Increase (+) ONLY — Inbound returns from Central Workshop / Repair Center',
    badgeColor: '#E65100', // Warning Amber
  },
  'TC-OPCDR': {
    code: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    name: 'Rehab Project Materials (TC-OPCDR)',
    description: 'Outside plant infrastructure hardware, cables, poles, and fittings consumed via Work Order #.',
    defaultBehavior: 'Stock Increase (+) via dispatches, Decrease (-) via Work Order #',
    badgeColor: '#43B02A', // Mobitel Lime Green
  },
  'TC-OPCDR-R': {
    code: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    name: 'Rehab Returned Materials (TC-OPCDR-R)',
    description: 'Returned Material from field rehab sites for salvage, reuse or testing.',
    defaultBehavior: 'Stock Increase (+) for reusable/rehabbed materials',
    badgeColor: '#0099FF', // Cyan Electric Blue
  },
};

export interface InventoryItem {
  id: string;
  materialCode: string; // e.g. 'OSPFIT002' or 'CPEFTH055S'
  description: string;  // e.g. 'ECHOLIFE HG8145V5 ONT BASE UNIT (HUAWEI)'
  subCategory: SubCategoryCode;
  mainCategory: MainCategory;
  quantity: number;     // On-hand stock
  receiving?: number;   // Receiving stage
  inbound?: number;     // Inbound stage
  unit: 'PCS' | 'METERS' | 'SETS' | 'ROLLS' | 'UNITS';
  isSerialized: boolean;
  serialNumbers?: string[]; // Serial numbers currently in stock
  minThreshold: number;
  lastUpdated: string;
  binLocation?: string;
}

export type ActionType = 
  | 'DISPATCH_RECEIVE'      // Stock Increase (+) via Main Branch Locator Tag
  | 'DEVICE_ALLOCATION'     // Stock Decrease (-) Workflow A: Customer Account
  | 'REHAB_CONSUMPTION'     // Stock Decrease (-) Workflow B: Work Order #
  | 'CUSTOMER_COLLECT'      // Stock Increase (+) Direct Collect from Customer into Collective (TCOPNC-C)
  | 'CUSTOMER_RETURN'       // Stock Increase (+) Workflow C: TCOPNC-R (Workshop Return)
  | 'REHAB_RECOVERY'        // Stock Increase (+) Workflow C: TC-OPCDR-R
  | 'COLLECTIVE_AUDIT'      // Collective stock operation in TCOPNC-C
  | 'INTER_BRANCH_TRANSFER' // Stock Decrease (-) Transfer to other branch / district with Move Order #
  | 'STOCK_ADJUSTMENT'      // Authorized adjustment
  | 'PRODUCT_CREATE'        // New product added
  | 'PRODUCT_UPDATE'        // Product edited
  | 'PRODUCT_DELETE';       // Product deleted

export interface LedgerTransaction {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  actionType: ActionType;
  mainCategory: MainCategory;
  subCategory: SubCategoryCode;
  materialCode: string;
  materialDescription: string;
  quantityDelta: number; // e.g. -1, +50
  unit: string;
  serialNumber?: string;
  accountNo?: string;        // Customer Account # (Workflow A)
  customerName?: string;     // Customer Name (Workflow A)
  workOrderNo?: string;      // Work Order # (Workflow B)
  locatorId?: string;        // Locator / Batch ID from Main Branch
  reasonCode?: string;       // Reason for return/recovery (Workflow C)
  itemCondition?: 'GOOD_REUSABLE' | 'FAULTY_REPAIR' | 'SCRAP';
  moveOrderNo?: string;      // Move Order # for Inter-Branch / District transfers
  destinationBranch?: string;
  destinationDistrict?: string;
  notes?: string;
  entryDate?: string;        // Date-wise recording (YYYY-MM-DD)
  syncStatus: 'SYNCED' | 'QUEUED_OFFLINE';
}

export interface StockTransfer {
  id: string;
  moveOrderNo: string;        // Mandatory Move Order #
  transferDate: string;       // YYYY-MM-DD
  timestamp: string;
  subCategory: SubCategoryCode;
  mainCategory: MainCategory;
  materialCode: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  isSerialized: boolean;
  serialNumbers?: string[];
  destinationDistrict: string;
  destinationBranch: string;
  dispatchOfficer: string;
  carrierVehicle?: string;
  notes?: string;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
}

export interface CustomerIssuance {
  id: string;
  issueDate: string;         // YYYY-MM-DD selected by user
  timestamp: string;         // Full timestamp
  materialCode: string;
  materialDescription: string;
  serialNumber?: string;     // Optional for bulk or non-serialized materials
  isSerialized: boolean;
  quantity: number;
  unit: string;
  accountNo: string;         // Customer Account #
  customerName: string;      // Customer Name
  customerContact?: string;  // Customer Phone / Mobile
  customerAddress?: string;  // Installation premises / address
  issuedBy: string;          // Field tech or officer name
  notes?: string;
  status: 'ACTIVE' | 'RETURNED_DIRECT' | 'RETURNED_WORKSHOP';
  // Return Tracking fields
  returnDate?: string;       // YYYY-MM-DD date when returned
  returnType?: 'TCOPNC-R' | 'TCOPNC-C'; // TCOPNC-C (Direct Customer Collective) vs TCOPNC-R (From Central Workshop Return)
  returnCondition?: 'GOOD_REUSABLE' | 'FAULTY_REPAIR' | 'SCRAP';
  returnNotes?: string;
  returnedBy?: string;
}

export interface ParsedBatchCode {
  rawString: string;
  locatorId: string;       // e.g. 'TC-01-REH-250104-999'
  materialCode: string;    // e.g. 'OSPFIT002'
  materialDescription: string; // e.g. 'AERIAL CABLE FITTING - SHARP ANGLED'
  detectedCategory: SubCategoryCode;
  dispatchBatchDate?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface UserPersona {
  id: string;
  name: string;
  role: 'ADMIN_IBT' | 'FIELD_TECH';
  title: string;
  branch: string;
}

export type OpenScannerFn = (
  hint?: string,
  callback?: (scannedText: string, allScanned?: string[]) => void,
  batchMode?: boolean
) => void;

