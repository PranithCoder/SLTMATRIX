import { InventoryItem, LedgerTransaction, SubCategoryCode, UserPersona, CustomerIssuance, StockTransfer, SystemAlert } from '../types/inventory';
import {
  pushInventoryToFirestore,
  pushLedgerToFirestore,
  pushIssuancesToFirestore,
  pushTransfersToFirestore,
  pushUsersToFirestore,
  pushSingleUser,
  deleteSingleUser,
  fetchUsersFromFirestore,
} from './firestoreService';

const STORAGE_KEYS = {
  INVENTORY: 'slt_matrix_inventory_v5',
  LEDGER: 'slt_matrix_ledger_v5',
  OFFLINE_QUEUE: 'slt_matrix_offline_queue_v1',
  ACTIVE_USER: 'slt_matrix_active_user_v1',
  IS_OFFLINE_SIMULATED: 'slt_matrix_offline_simulated',
  HIGH_CONTRAST: 'slt_matrix_high_contrast',
  CUSTOMER_ISSUANCES: 'slt_matrix_customer_issuances_v2',
  TRANSFERS: 'slt_matrix_transfers_v3',
  AUTH_SESSION: 'slt_matrix_auth_session_v1',
  USERS: 'slt_matrix_users_prod_v1',
  SYSTEM_ALERTS: 'slt_matrix_alerts_v1',
};

export const MOCK_AUTH_CREDENTIALS = {
  email: 'kanishka@slt.lk',
  password: 'kanishka@123',
  name: 'Mr. Kanishka',
  role: 'ADMIN_IBT',
  title: 'IBT Lead & Infrastructure Supervisor',
  branch: 'SLT-MOBITEL Colombo HQ / Regional Ops',
};

export const INITIAL_USERS: UserPersona[] = [
  {
    id: 'USR-KANISHKA',
    name: 'Mr. Kanishka',
    email: 'kanishka@slt.lk',
    password: 'kanishka@123',
    role: 'ADMIN_IBT',
    title: 'IBT Lead & Infrastructure Supervisor',
    branch: 'SLT-MOBITEL Colombo HQ / Regional Ops',
    isOnline: true,
    lastActive: 'Just now',
    createdDate: '2025-01-01',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  // Standard New Connection (TCOPNC / TC-OPNC)
  // Official SLT-MOBITEL dostocks inventory records (56 items, 26,419.1 units):
  {
    id: 'nc-1',
    materialCode: 'CPERTR042',
    description: 'ADSL ROUTER 4-PORT (WI-FI) - FIBERHOME HG-180 (DOT LOGO)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-RTR-01',
  },
  {
    id: 'nc-2',
    materialCode: 'CPERTR045S',
    description: 'ADSL ROUTER 4-PORT (WI-FI) - PROLINK PRS1140 (DOT LOGO) (SERIAL ENABLED)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-RTR-02',
  },
  {
    id: 'nc-3',
    materialCode: 'CPERTR022S',
    description: 'ADSL ROUTER 4-PORT (WI-FI) - TP LINK TD-W8951ND (DOT LOGO) (SERIAL ENABLED)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 11,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-RTR-03',
  },
  {
    id: 'nc-4',
    materialCode: 'NWKWFM049',
    description: 'ARUBA AP-303 (RW) UNIFIED AP',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ENT-01',
  },
  {
    id: 'nc-5',
    materialCode: 'OSPACC012',
    description: 'BOLT & NUT - L118 (7" x 1/2")',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 80,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-HDW-01',
  },
  {
    id: 'nc-6',
    materialCode: 'OSPACC012-B',
    description: 'BOLT & NUT - L118 (7" x 1/2") - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 30,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-HDW-02',
  },
  {
    id: 'nc-7',
    materialCode: 'NWKEAC084',
    description: 'C1121X-8P ISR 1100 8P DUAL GE SFP WAN 8GB ROUTER',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 4,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ENT-02',
  },
  {
    id: 'nc-8',
    materialCode: 'CPEDAT045',
    description: 'CISCO 891F/K9 ROUTER',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ENT-03',
  },
  {
    id: 'nc-9',
    materialCode: 'OSPACC016',
    description: 'CLEAT DROPWIRE',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 2317,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-DW-01',
  },
  {
    id: 'nc-10',
    materialCode: 'OSPCPL009',
    description: 'CONCRETE POLE LOW COST - L22 (22 FT / 6.7 m)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 32,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-YARD-POLE-01',
  },
  {
    id: 'nc-11',
    materialCode: 'OSPCPL007',
    description: 'CONCRETE POLE SPUN - L22 (22 FT / 6.7 m)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 7,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-YARD-POLE-02',
  },
  {
    id: 'nc-12',
    materialCode: 'OSPCNT017',
    description: 'CONNECTOR (DROPWIRE CABLE)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 245,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-DW-02',
  },
  {
    id: 'nc-13',
    materialCode: 'CPEDAT004',
    description: 'CPE 1424 SHDSL ADVANCED EFM/ATM FEE 1-PORT',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-DSL-01',
  },
  {
    id: 'nc-14',
    materialCode: 'CPEDAT006',
    description: 'CPE 1432 SHDSL ATM V.35 1-PORT',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-DSL-02',
  },
  {
    id: 'nc-15',
    materialCode: 'OSPERD007',
    description: 'EARTH ROD 120 cm (DRIVING SPIKE-END SLEEVE) 0.56 mm',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 70,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ERD-01',
  },
  {
    id: 'nc-16',
    materialCode: 'OSPFTA002',
    description: 'FAC CONNECTOR',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 590,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-FIB-01',
  },
  {
    id: 'nc-17',
    materialCode: 'OSPFTA002-B',
    description: 'FAC CONNECTOR - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 340,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 30,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-FIB-02',
  },
  {
    id: 'nc-18',
    materialCode: 'OSPFTA003',
    description: 'FIBER DROP WIRE (40 km)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 40,
    receiving: 0,
    inbound: 0,
    unit: 'ROLLS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-YARD-CBL-01',
  },
  {
    id: 'nc-19',
    materialCode: 'OSPFTA003-B',
    description: 'FIBER DROP WIRE (39 km) - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 39,
    receiving: 0,
    inbound: 0,
    unit: 'ROLLS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-YARD-CBL-02',
  },
  {
    id: 'nc-20',
    materialCode: 'OSPFTA005',
    description: 'FIBER DROP WIRE RETAINER (WHITE)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1420,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-DW-03',
  },
  {
    id: 'nc-21',
    materialCode: 'OSPFTA005-B',
    description: 'FIBER DROP WIRE RETAINER (WHITE) - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 3200,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 200,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-DW-04',
  },
  {
    id: 'nc-22',
    materialCode: 'OSPFTA007',
    description: 'FIBRE ROSETTE BOX',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 75,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 15,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-FIB-03',
  },
  {
    id: 'nc-23',
    materialCode: 'OSPFTA007-B',
    description: 'FIBRE ROSETTE BOX - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 293,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 25,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-FIB-04',
  },
  {
    id: 'nc-24',
    materialCode: 'NWKSRG261',
    description: 'FORTIGATE-40F',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 7,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-SEC-01',
  },
  {
    id: 'nc-25',
    materialCode: 'NWKSRG262',
    description: 'FORTIGATE-60F',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-SEC-02',
  },
  {
    id: 'nc-26',
    materialCode: 'CPEFTH064S',
    description: 'FTTH ONT - TENDA / HG7',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 47,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ONT-01',
  },
  {
    id: 'nc-27',
    materialCode: 'CPEFTH064S-B',
    description: 'FTTH ONT - TENDA / HG7 - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 72,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 15,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ONT-02',
  },
  {
    id: 'nc-28',
    materialCode: 'CPEFTH065S',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ONT-03',
  },
  {
    id: 'nc-29',
    materialCode: 'CPEFTH065S-B',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410 - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 4,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ONT-04',
  },
  {
    id: 'nc-30',
    materialCode: 'OSPACC018',
    description: 'HOOK "C"',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-HDW-03',
  },
  {
    id: 'nc-31',
    materialCode: 'OSPACC018-B',
    description: 'HOOK "C" - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 254,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-HDW-04',
  },
  {
    id: 'nc-32',
    materialCode: 'OSPACC017',
    description: 'HOOK "L"',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 363,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 30,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-HDW-05',
  },
  {
    id: 'nc-33',
    materialCode: 'CPEDAT039',
    description: 'IADS WITH 4 ANALOG RJ-11 PORTS (WITH LOCAL SURVIVABILITY)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-VOIP-01',
  },
  {
    id: 'nc-34',
    materialCode: 'CPEDAT040S',
    description: 'IADS WITH 8 ANALOG RJ-11 PORTS (WITH LOCAL SURVIVABILITY) - SERIAL ENABLED',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-VOIP-02',
  },
  {
    id: 'nc-35',
    materialCode: 'CPEDAT074',
    description: 'IP PHONE - GRANDSTREAM GRP-2602P + POWER ADAPTER',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-VOIP-03',
  },
  {
    id: 'nc-36',
    materialCode: 'CPEDAT068',
    description: 'IP PHONE - GRANDSTREAM GXP-1782',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-VOIP-04',
  },
  {
    id: 'nc-37',
    materialCode: 'NWKEAC053',
    description: 'ISR1100-4G ISR1100 SERIES ROUTER, 4 ETH LAN/WAN PORTS, 4G RAM',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ENT-04',
  },
  {
    id: 'nc-38',
    materialCode: 'NWKEAC053-B',
    description: 'ISR1100-4G ISR1100 SERIES ROUTER, 4 ETH LAN/WAN PORTS, 4G RAM - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-ENT-05',
  },
  {
    id: 'nc-39',
    materialCode: 'OSPACC070',
    description: 'PVC CASINGS (16mm x 12.5mm)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1080,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CSG-01',
  },
  {
    id: 'nc-40',
    materialCode: 'OSPACC070-B',
    description: 'PVC CASINGS (16mm x 12.5mm) - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 953,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CSG-02',
  },
  {
    id: 'nc-41',
    materialCode: 'OSPWIR026',
    description: 'PVC EARTH WIRE 7/0.67 (2.5 Sq.mm)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 265,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-WIR-01',
  },
  {
    id: 'nc-42',
    materialCode: 'OSPWIR011',
    description: 'PVC TWIN CABLE 1/10 (0.65 mm)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 400,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-WIR-02',
  },
  {
    id: 'nc-43',
    materialCode: 'OSPWIR011-B',
    description: 'PVC TWIN CABLE 1/10 (0.65 mm) - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 400,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-WIR-03',
  },
  {
    id: 'nc-44',
    materialCode: 'ITEACC039',
    description: 'RJ11 CONNECTOR',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 18,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CON-01',
  },
  {
    id: 'nc-45',
    materialCode: 'ITEACC038',
    description: 'RJ45 CONNECTOR',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 669,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CON-02',
  },
  {
    id: 'nc-46',
    materialCode: 'ITEACC038-B',
    description: 'RJ45 CONNECTOR - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 400,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CON-03',
  },
  {
    id: 'nc-47',
    materialCode: 'CPESTB031V',
    description: 'SET TOP BOX (STB) - SEI 300SLT (PACK)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 30,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-STB-01',
  },
  {
    id: 'nc-48',
    materialCode: 'CPEFTA031',
    description: 'SINGLE CABLE, STRAIGHT THROUGH CABLE, (2m), MP8-I, CC4P0.5GY, MP8-I, UNSHIELDED',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 161,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CBL-01',
  },
  {
    id: 'nc-49',
    materialCode: 'BCPEFTA003',
    description: 'SINGLE STRAIGHT THROUGH CABLE MP8-1 CC4P0 5GY (3 m)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 48,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CBL-02',
  },
  {
    id: 'nc-50',
    materialCode: 'OSPACC004',
    description: 'STAPLE WIRE CABLE CLIP (4 mm)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CLP-01',
  },
  {
    id: 'nc-51',
    materialCode: 'OSPACC004-B',
    description: 'STAPLE WIRE CABLE CLIP (4 mm) - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 5200,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 200,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CLP-02',
  },
  {
    id: 'nc-52',
    materialCode: 'OSPACC005',
    description: 'STAPLE WIRE CABLE CLIP (5 mm)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 5305,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 200,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-CLP-03',
  },
  {
    id: 'nc-53',
    materialCode: 'OSPSTP007',
    description: 'STATION PROTECTOR',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 22,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-STP-01',
  },
  {
    id: 'nc-54',
    materialCode: 'CPEPST013S',
    description: 'TELEPHONE PANASONIC KX TS 500MXW (IVORY) (SERIAL ENABLED)',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 12,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-TEL-01',
  },
  {
    id: 'nc-55',
    materialCode: 'ITEACC046',
    description: 'UTP CABLE CAT 5E',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1495,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-UTP-01',
  },
  {
    id: 'nc-56',
    materialCode: 'ITEACC046-B',
    description: 'UTP CABLE CAT 5E - BATCH 2',
    subCategory: 'TCOPNC',
    mainCategory: 'New Connection',
    quantity: 1220,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'NC-BIN-UTP-02',
  },

  // Customer Returns (TC-OPNC-R / TCOPNC-R)
  // Official SLT-MOBITEL dostocks inventory records (31 items):
  {
    id: 'ret-1',
    materialCode: 'OSPACC016',
    description: 'CLEAT DROPWIRE',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 1500,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-01',
  },
  {
    id: 'ret-2',
    materialCode: 'CPEDAT004S',
    description: 'CPE 1424 SHDSL ADVANCED EFM/ATM FEE 1-PORT (SERIAL ENABLE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-SHDSL',
  },
  {
    id: 'ret-3',
    materialCode: 'CPEFTH055S',
    description: 'ECHOLIFE HG8145V5 ONT BASE UNIT (HUAWEI)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 6,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-HW55',
  },
  {
    id: 'ret-4',
    materialCode: 'CPEFTH056',
    description: 'ECHOLIFE HG8145V5 ONT POWER SUPPLY UNIT, UK PLUG',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 45,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-PWR',
  },
  {
    id: 'ret-5',
    materialCode: 'CPEFTH037',
    description: 'ECHOLIFE HG8145V5, GPON TERMINAL, SC/APC, UK STANDARD ADAPTER, ENGLISH',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 7,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-HW37',
  },
  {
    id: 'ret-6',
    materialCode: 'CPEFTH045S',
    description: 'ECHOLIFE HG8245H5 ONT BASE UNIT (HUAWEI)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 45,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-HW45',
  },
  {
    id: 'ret-7',
    materialCode: 'CPEFTH046',
    description: 'ECHOLIFE HG8245H5 ONT POWER SUPPLY UNIT, UK PLUG',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 28,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-PWR',
  },
  {
    id: 'ret-8',
    materialCode: 'CPEFTH068S',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410 - BASE UNIT',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 8,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-CD68',
  },
  {
    id: 'ret-9',
    materialCode: 'CPEFTA045',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410 - FIBER PATCH CODE',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 16,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-CABLE',
  },
  {
    id: 'ret-10',
    materialCode: 'CPEFTA044',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410 - POWER SUPPLY UNIT',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 30,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-PWR',
  },
  {
    id: 'ret-11',
    materialCode: 'CPEFTH028S',
    description: 'HUAWEI HG8245H GPON - UNIT ONLY (SERIAL ENABLED) (ONT)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 6,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-HW28',
  },
  {
    id: 'ret-12',
    materialCode: 'CPEFTH015S',
    description: 'HUAWEI HG8245H5 GPONT TERMINAL ADAPTER EN SC/APC (UK STANDARD) (SERIAL ENABLED)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-HW15',
  },
  {
    id: 'ret-13',
    materialCode: 'CPELTE008S',
    description: 'LTE ROUTER - HUAWEI B310S-925 (SERIAL ENABLED)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-LTE',
  },
  {
    id: 'ret-14',
    materialCode: 'NWKPTC227',
    description: 'PATCH CORD, SC/APC, SC/UPC, SINGLE-MODE,(2m), G.652D,(3mm)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 12,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-CABLE',
  },
  {
    id: 'ret-15',
    materialCode: 'CPESTB027',
    description: 'SET TOP BOX (STB) - HWACOM HC-J3370-S4 (PACK)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 6,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-STB',
  },
  {
    id: 'ret-16',
    materialCode: 'CPEFTA031',
    description: 'SINGLE CABLE, STRAIGHT THROUGH CABLE, (2m), MP8-I, CC4P0.5GY, MP8-I, UNSHIELDED',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 18,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-CABLE',
  },
  {
    id: 'ret-17',
    materialCode: 'CPESTA035V',
    description: 'STB AV CABLE - SEI 300SLT (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-CABLE',
  },
  {
    id: 'ret-18',
    materialCode: 'CPESTA015',
    description: 'STB CAT5 CABLE 3M',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-CABLE',
  },
  {
    id: 'ret-19',
    materialCode: 'CPESTA011',
    description: 'STB HDMI CABLE',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 57,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-CABLE',
  },
  {
    id: 'ret-20',
    materialCode: 'CPESTA034V',
    description: 'STB IR REMOTE CONTROL - SEI300SLT (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 35,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-RMT',
  },
  {
    id: 'ret-21',
    materialCode: 'CPESTB030',
    description: 'STB MAIN UNIT - HWACOM HC-J3370-S4.1 (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 21,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-STB',
  },
  {
    id: 'ret-22',
    materialCode: 'CPESTB001S',
    description: 'STB MAIN UNIT - NETGEM N7700 (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 12,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-STB',
  },
  {
    id: 'ret-23',
    materialCode: 'CPESTB008S',
    description: 'STB MAIN UNIT - NETGEM N7800 (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 18,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-STB',
  },
  {
    id: 'ret-24',
    materialCode: 'CPESTB032V',
    description: 'STB MAIN UNIT - SEI 300SLT (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-STB-01',
  },
  {
    id: 'ret-25',
    materialCode: 'CPESTB032V-B',
    description: 'STB MAIN UNIT - SEI 300SLT (SPARE) - BATCH 2',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 37,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-BAY-STB-02',
  },
  {
    id: 'ret-26',
    materialCode: 'CPESTB009',
    description: 'STB NETGEM POWER SUPPLY UNIT 12V (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 33,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-PWR',
  },
  {
    id: 'ret-27',
    materialCode: 'CPESTB010',
    description: 'STB NETGEM REMOTE CONTROL (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 38,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-RMT',
  },
  {
    id: 'ret-28',
    materialCode: 'CPESTB016',
    description: 'STB POWER SUPPLY UNIT HWACOM HC J3370 (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-PWR',
  },
  {
    id: 'ret-29',
    materialCode: 'CPESTB017',
    description: 'STB REMOTE CONTROL - HWACOM HC-J3370 (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 33,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-RMT',
  },
  {
    id: 'ret-30',
    materialCode: 'CPESTA013',
    description: 'STB REMOTE CONTROL - NETGEM N7700',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 20,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-RMT',
  },
  {
    id: 'ret-31',
    materialCode: 'CPESTA033V',
    description: 'STB POWER SUPPLY UNIT - SEI 300SLT (SPARE)',
    subCategory: 'TCOPNC-R',
    mainCategory: 'New Connection',
    quantity: 40,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:30',
    binLocation: 'RET-ACC-PWR',
  },

  // Collective Stock / Recovery (TC-OPNC-C / TCOPNC-C)
  // Official SLT-MOBITEL dostocks inventory records:
  {
    id: 'col-1',
    materialCode: 'CPEFTH055S',
    description: 'ECHOLIFE HG8145V5 ONT BASE UNIT (HUAWEI)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-01',
  },
  {
    id: 'col-2',
    materialCode: 'CPEFTH056',
    description: 'ECHOLIFE HG8145V5 ONT POWER SUPPLY UNIT, UK PLUG',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-01',
  },
  {
    id: 'col-3',
    materialCode: 'CPEFTH037',
    description: 'ECHOLIFE HG8145V5, GPON TERMINAL, SC/APC, UK STANDARD ADAPTER, ENGLISH',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-01',
  },
  {
    id: 'col-4',
    materialCode: 'CPEFTH064S',
    description: 'FTTH ONT - TENDA / HG7',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-01',
  },
  {
    id: 'col-5',
    materialCode: 'CPEFTH068S',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410 - BASE UNIT',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-02',
  },
  {
    id: 'col-6',
    materialCode: 'CPEFTA045',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410 - FIBER PATCH CODE',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-02',
  },
  {
    id: 'col-7',
    materialCode: 'CPEFTA044',
    description: 'FTTH ONT/ONU - C-DATA/ FD602GW-DX-R410 - POWER SUPPLY UNIT',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-02',
  },
  {
    id: 'col-8',
    materialCode: 'CPEFTH015S',
    description: 'HUAWEI HG8245H5 GPONT TERMINAL ADAPTER EN SC/APC (UK STANDARD) (SERIAL ENABLED)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STK-02',
  },
  {
    id: 'col-9',
    materialCode: 'NWKPTC227',
    description: 'PATCH CORD, SC/APC, SC/UPC, SINGLE-MODE, (2m), G.652D, (3mm)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-CABLE-01',
  },
  {
    id: 'col-10',
    materialCode: 'CPESTB023',
    description: 'SET TOP BOX (STB) - SDMC DV8040 (PACK)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STB-01',
  },
  {
    id: 'col-11',
    materialCode: 'CPESTB031V',
    description: 'SET TOP BOX (STB) - SEI 300SLT (PACK)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STB-01',
  },
  {
    id: 'col-12',
    materialCode: 'CPESTA035V',
    description: 'STB AV CABLE - SEI 300SLT (SPARE)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-ACC-01',
  },
  {
    id: 'col-13',
    materialCode: 'CPESTA015',
    description: 'STB CAT5 CABLE 3M',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-ACC-01',
  },
  {
    id: 'col-14',
    materialCode: 'CPESTA011',
    description: 'STB HDMI CABLE',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-ACC-01',
  },
  {
    id: 'col-15',
    materialCode: 'CPESTA034V',
    description: 'STB IR REMOTE CONTROL - SEI300SLT (SPARE)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-ACC-01',
  },
  {
    id: 'col-16',
    materialCode: 'CPESTB032V',
    description: 'STB MAIN UNIT - SEI 300SLT (SPARE)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: true,
    serialNumbers: [],
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-STB-01',
  },
  {
    id: 'col-17',
    materialCode: 'CPESTA033V',
    description: 'STB POWER SUPPLY UNIT - SEI 300SLT (SPARE)',
    subCategory: 'TCOPNC-C',
    mainCategory: 'New Connection',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2025-01-04 12:00',
    binLocation: 'COL-ACC-01',
  },

  // Rehabilitation (TC-OPCDR) - Bulk Non-Serialized & OSP hardware
  // Rehabilitation (TC-OPCDR) - Official Material Verification Sheet (86 Items, 12,058 units)
  {
    id: 'reh-1',
    materialCode: 'OSPFIT002',
    description: 'AERIAL CABLE FITTING - SHARP ANGLED',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-2',
    materialCode: 'OSPFIT011',
    description: 'AERIAL CABLE FITTING FOR SPUN POLE - SHARP ANGLED',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 5,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-3',
    materialCode: 'HDBHDW351',
    description: 'BARBED WIRE GALVANIZED',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'ROLLS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-4',
    materialCode: 'OSPACC010',
    description: 'BOLT & NUT - L116 (6" x 1/2")',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 4,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-5',
    materialCode: 'CPCACC064',
    description: 'BRANCH OFF KIT (LARGE)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-6',
    materialCode: 'CPCACC062',
    description: 'BRANCH OFF KIT (SMALL)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-7',
    materialCode: 'OSPACC015',
    description: 'BRIDLE RING',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 24,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-162103-999',
  },
  {
    id: 'reh-8',
    materialCode: 'OSPACC015-B',
    description: 'BRIDLE RING (DEPOT 2)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 115,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-9',
    materialCode: 'OSPACC015-C',
    description: 'BRIDLE RING (DEPOT 3)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 18,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-10',
    materialCode: 'CPCARL009',
    description: 'CABLE AERIAL (0.5 mm/10 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1671,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-11',
    materialCode: 'BCPCARL014',
    description: 'CABLE AERIAL (0.5 mm/100 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 138,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-SSD-160203-999',
  },
  {
    id: 'reh-12',
    materialCode: 'CPCARL014',
    description: 'CABLE AERIAL (0.5 mm/100 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 235,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-160203-999',
  },
  {
    id: 'reh-13',
    materialCode: 'BCPCARL014-B',
    description: 'CABLE AERIAL (0.5 mm/100 PR) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 319,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-130307-999',
  },
  {
    id: 'reh-14',
    materialCode: 'CPCARL014-B',
    description: 'CABLE AERIAL (0.5 mm/100 PR) - BATCH 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 650,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-15',
    materialCode: 'BCPCARL015',
    description: 'CABLE AERIAL (0.5 mm/150 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 15,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-150202-999',
  },
  {
    id: 'reh-16',
    materialCode: 'CPCARL015',
    description: 'CABLE AERIAL (0.5 mm/150 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 420,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-162103-999',
  },
  {
    id: 'reh-17',
    materialCode: 'CPCARL010',
    description: 'CABLE AERIAL (0.5 mm/20 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 244,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-18',
    materialCode: 'BCPCARL012',
    description: 'CABLE AERIAL (0.5 mm/50 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 486,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-SSD-160203-999',
  },
  {
    id: 'reh-19',
    materialCode: 'BCPCARL012-B',
    description: 'CABLE AERIAL (0.5 mm/50 PR) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 56,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-130307-999',
  },
  {
    id: 'reh-20',
    materialCode: 'CPCARL012',
    description: 'CABLE AERIAL (0.5 mm/50 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 30,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-162103-999',
  },
  {
    id: 'reh-21',
    materialCode: 'BCPCARL012-C',
    description: 'CABLE AERIAL (0.5 mm/50 PR) - BATCH 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 55,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-162103-999',
  },
  {
    id: 'reh-22',
    materialCode: 'BCPCARL016',
    description: 'CABLE AERIAL S/S U/TWIN (0.5 mm/200 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 138,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 30,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-23',
    materialCode: 'BCPCARL016-B',
    description: 'CABLE AERIAL S/S U/TWIN (0.5 mm/200 PR) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 80,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-24',
    materialCode: 'BCPCARL011',
    description: 'CABLE AERIAL S/S U/TWIN (0.5 mm/30 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 28,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-SSD-160202-999',
  },
  {
    id: 'reh-25',
    materialCode: 'BCPCUGC056',
    description: 'CABLE UG (0.5 mm/10 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 114,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 30,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-SSD-160203-999',
  },
  {
    id: 'reh-26',
    materialCode: 'CPCUGC056',
    description: 'CABLE UG (0.5 mm/10 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 37,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-27',
    materialCode: 'CPCUGC057',
    description: 'CABLE UG (0.5 mm/20 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 530,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-28',
    materialCode: 'CPCUGC062',
    description: 'CABLE UG (0.5 mm/200 PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 260,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 40,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-29',
    materialCode: 'OSPCCT023',
    description: 'CCT PROTECTED EXTERNAL (10PR)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 12,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260001-999',
  },
  {
    id: 'reh-30',
    materialCode: 'OSPCCT023-B',
    description: 'CCT PROTECTED EXTERNAL (10PR) - BIN 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250002-999',
  },
  {
    id: 'reh-31',
    materialCode: 'OSPCCT023-C',
    description: 'CCT PROTECTED EXTERNAL (10PR) - BIN 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 8,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-32',
    materialCode: 'CPCACC002',
    description: 'CLOSURE UG (43-8-200)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 15,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 3,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-33',
    materialCode: 'OSPCPL003',
    description: 'CONCRETE POLE - L24 (24 FT / 7.5 m)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 11,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260001-999',
  },
  {
    id: 'reh-34',
    materialCode: 'OSPCPL004',
    description: 'CONCRETE POLE - L26 (26 FT / 8.0 m)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260001-999',
  },
  {
    id: 'reh-35',
    materialCode: 'OSPCPL005',
    description: 'CONCRETE POLE - L30 (30 FT / 9.0 m)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 10,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-36',
    materialCode: 'OSPCPL007',
    description: 'CONCRETE POLE SPUN - L22 (22 FT / 6.7 m)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-37',
    materialCode: 'OSPCPL007-B',
    description: 'CONCRETE POLE SPUN - L22 (22 FT / 6.7 m) - BIN 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 4,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-SSD--',
  },
  {
    id: 'reh-38',
    materialCode: 'OSPCPL007-C',
    description: 'CONCRETE POLE SPUN - L22 (22 FT / 6.7 m) - BIN 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-SSD-160203-999',
  },
  {
    id: 'reh-39',
    materialCode: 'OSPCNT017',
    description: 'CONNECTOR (DROPWIRE CABLE)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 800,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250002-999',
  },
  {
    id: 'reh-40',
    materialCode: 'OSPCNT017-B',
    description: 'CONNECTOR (DROPWIRE CABLE) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 2600,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 200,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-41',
    materialCode: 'OSPCNT002',
    description: 'CONNECTOR UY 2 (0.4 mm - 0.9 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1000,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 200,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-42',
    materialCode: 'OSPCBM049',
    description: 'CROSS CONNECTION CABINET WITH LOCK - KRONE 59M2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-43',
    materialCode: 'OSPCBM052',
    description: 'DOOR RETAINER - KRONE 59M2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-44',
    materialCode: 'OSPWIR001',
    description: 'DROP WIRE SELF SUPPORTING (0.65 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 300,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 50,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-45',
    materialCode: 'OSPWIR001-B',
    description: 'DROP WIRE SELF SUPPORTING (0.65 mm) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 500,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 100,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-46',
    materialCode: 'OSPCBM045',
    description: 'EARTH CONNECTOR OF CABINET - KRONE 83A/59M2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-47',
    materialCode: 'OSPERD007',
    description: 'EARTH ROD 120 cm (DRIVING SPIKE-END SLEEVE) 0.56 mm',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 53,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-48',
    materialCode: 'OSPERD007-B',
    description: 'EARTH ROD 120 cm (DRIVING SPIKE-END SLEEVE) 0.56 mm - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 10,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-49',
    materialCode: 'OSPFTA001',
    description: 'FIBER DISTRIBUTION POINT',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 13,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-50',
    materialCode: 'OSPACC061',
    description: 'FIBER DISTRIBUTION POINT - POLE MOUNT',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-190106-999',
  },
  {
    id: 'reh-51',
    materialCode: 'OSPFTA003',
    description: 'FIBER DROP WIRE',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'ROLLS',
    isSerialized: false,
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-52',
    materialCode: 'OSPACC076',
    description: 'FIBER DROP WIRE RETAINER (NON-METALLIC)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 250,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-53',
    materialCode: 'OSPFTA005',
    description: 'FIBER DROP WIRE RETAINER (WHITE)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 12,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-230101-999',
  },
  {
    id: 'reh-54',
    materialCode: 'OSPFTA005-B',
    description: 'FIBER DROP WIRE RETAINER (WHITE) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 200,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250002-999',
  },
  {
    id: 'reh-55',
    materialCode: 'OSPFTA005-C',
    description: 'FIBER DROP WIRE RETAINER (WHITE) - BATCH 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 10,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-56',
    materialCode: 'OSPFTA015',
    description: 'FIBER SLEEVE 60 MM (DOUBLE ROD) WITH A PROTECTION BOX',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-57',
    materialCode: 'OSPFTA004',
    description: 'FIBER SPLITTER 1:8 (PLC TYPE)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-58',
    materialCode: 'OFCACC032',
    description: 'FIBER SPLITTER 1:8 (PLC TYPE) - ALTERNATE',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-59',
    materialCode: 'OSPCBM060',
    description: 'FIBER TERMINATION CABINET (POLE MOUNT 16 PORTS)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'UNITS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-190106-999',
  },
  {
    id: 'reh-60',
    materialCode: 'OSPCBM050',
    description: 'FIXING MATERIAL FOR BACK MOUNT FRAME - KRONE 59M2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 4,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-61',
    materialCode: 'OSPMHH002',
    description: 'FRAME AND COVER - HANDHOLE HH02',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 1,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-62',
    materialCode: 'OSPMHH003',
    description: 'FRAME AND COVER - HANDHOLE HH03',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 3,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-63',
    materialCode: 'OSPMHH013',
    description: 'FRAME AND COVER - MANHOLE S1',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 6,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 1,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-64',
    materialCode: 'OSPACC023',
    description: 'GRIP WIRE PREFORMED STAINLESS STEEL CABLE (18 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 30,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-65',
    materialCode: 'OSPACC026',
    description: 'GRIP WIRE PREFORMED STAINLESS STEEL CABLE (38 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 45,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-66',
    materialCode: 'OSPACC072',
    description: 'GRIP WIRE PREFORMED STAINLESS STEEL CABLE (8 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 20,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-67',
    materialCode: 'OSPACC018',
    description: 'HOOK "C"',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-68',
    materialCode: 'OSPACC017',
    description: 'HOOK "L"',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 17,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 2,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-69',
    materialCode: 'OSPCBM046',
    description: 'IRON CLAMP OF CABINET - KRONE 83A/59M2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH--',
  },
  {
    id: 'reh-70',
    materialCode: 'OSPWIR026',
    description: 'PVC EARTH WIRE 7/0.67 (2.5 Sq.mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-71',
    materialCode: 'OSPWIR011',
    description: 'PVC TWIN CABLE 1/10 (0.65 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 200,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 30,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-72',
    materialCode: 'OSPACC014',
    description: 'RETAINER DROPWIRE',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-250104-999',
  },
  {
    id: 'reh-73',
    materialCode: 'OSPACC014-B',
    description: 'RETAINER DROPWIRE - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250002-999',
  },
  {
    id: 'reh-74',
    materialCode: 'OSPACC014-C',
    description: 'RETAINER DROPWIRE - BATCH 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 30,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-75',
    materialCode: 'OSPACC014-D',
    description: 'RETAINER DROPWIRE - BATCH 4',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 230,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-76',
    materialCode: 'OSPACC019',
    description: 'ROD STAY COMPLETE',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 18,
    receiving: 0,
    inbound: 0,
    unit: 'SETS',
    isSerialized: false,
    minThreshold: 3,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-77',
    materialCode: 'OSPACC029',
    description: 'STAINLESS STEEL BAND (10 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 304,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 30,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-SSD-160202-999',
  },
  {
    id: 'reh-78',
    materialCode: 'OSPACC029-B',
    description: 'STAINLESS STEEL BAND (10 mm) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 40,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250107-999',
  },
  {
    id: 'reh-79',
    materialCode: 'OSPACC029-C',
    description: 'STAINLESS STEEL BAND (10 mm) - BATCH 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 40,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-80',
    materialCode: 'OSPACC029-D',
    description: 'STAINLESS STEEL BAND (10 mm) - BATCH 4',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 32,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-81',
    materialCode: 'OSPACC029-E',
    description: 'STAINLESS STEEL BAND (10 mm) - BATCH 5',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 150,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 20,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-260001-999',
  },
  {
    id: 'reh-82',
    materialCode: 'OSPACC005',
    description: 'STAPLE WIRE CABLE CLIP (5 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 100,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-83',
    materialCode: 'OSPSTP007',
    description: 'STATION PROTECTOR',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 82,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 10,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250104-999',
  },
  {
    id: 'reh-84',
    materialCode: 'OSPACC032',
    description: 'STEEL BUCKLE (13.5 mm)',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 20,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-260104-999',
  },
  {
    id: 'reh-85',
    materialCode: 'OSPACC032-B',
    description: 'STEEL BUCKLE (13.5 mm) - BATCH 2',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 20,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-CDR-250107-999',
  },
  {
    id: 'reh-86',
    materialCode: 'OSPACC032-C',
    description: 'STEEL BUCKLE (13.5 mm) - BATCH 3',
    subCategory: 'TC-OPCDR',
    mainCategory: 'Rehabilitation',
    quantity: 25,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 5,
    lastUpdated: '2026-06-07',
    binLocation: 'TC-01-REH-230101-999',
  },

  // Rehab Returned Material (TC-OPCDR-R)
  // Official SLT Dostocks Verification Sheet (10 Items, 4,452 Units)
  {
    id: 'reh-ret-1',
    materialCode: 'CPCUGC062',
    description: 'CABLE UG (0.5 mm/200 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 365,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-2',
    materialCode: 'OSPCPL002',
    description: 'CONCRETE POLE SQUARE - L22 (22 FT / 6.7 m)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 2,
    receiving: 0,
    inbound: 0,
    unit: 'PCS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-3',
    materialCode: 'CPCARL015',
    description: 'CABLE AERIAL (0.5 mm/150 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 315,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-4',
    materialCode: 'BCPCARL016',
    description: 'CABLE AERIAL S/S U/TWIN (0.5 mm/200 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 110,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-5',
    materialCode: 'CPCARL011',
    description: 'CABLE AERIAL S/S U/TWIN (0.5 mm/30 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 735,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-6',
    materialCode: 'CPCUGC056',
    description: 'CABLE UG (0.5 mm/10 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 30,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-7',
    materialCode: 'CPCUGC057',
    description: 'CABLE UG (0.5 mm/20 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 645,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-8',
    materialCode: 'CPCARL010',
    description: 'CABLE AERIAL (0.5 mm/20 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 375,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-9',
    materialCode: 'CPCARL012',
    description: 'CABLE AERIAL (0.5 mm/50 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 1255,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
  {
    id: 'reh-ret-10',
    materialCode: 'CPCARL014',
    description: 'CABLE AERIAL (0.5 mm/100 PR)',
    subCategory: 'TC-OPCDR-R',
    mainCategory: 'Rehabilitation',
    quantity: 620,
    receiving: 0,
    inbound: 0,
    unit: 'METERS',
    isSerialized: false,
    minThreshold: 0,
    lastUpdated: '2026-06-07',
    binLocation: 'USB-TC-OPCD--',
  },
];

export const INITIAL_LEDGER: LedgerTransaction[] = [];

export const INITIAL_CUSTOMER_ISSUANCES: CustomerIssuance[] = [];

export const INITIAL_TRANSFERS: StockTransfer[] = [];

class StorageService {
  constructor() {
    this.runCleanSlateMigration();
  }

  runCleanSlateMigration(): void {
    if (typeof window === 'undefined') return;
    const PURGE_KEY = 'SLT_PURGE_TEST_DATA_2026_PROD_CLEAN_V2';
    if (!localStorage.getItem(PURGE_KEY)) {
      localStorage.setItem(PURGE_KEY, 'true');
      // Wipe old testing storage keys
      localStorage.removeItem('slt_matrix_inventory_v4');
      localStorage.removeItem('slt_matrix_ledger_v4');
      localStorage.removeItem('slt_matrix_customer_issuances_v1');
      localStorage.removeItem('slt_matrix_transfers_v2');
      localStorage.removeItem('slt_matrix_offline_queue_v1');

      // Initialize fresh keys with pristine baseline
      const cleanInventory = INITIAL_INVENTORY.map((item) => ({
        ...item,
        serialNumbers: [],
      }));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(cleanInventory));
      localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_ISSUANCES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
    }
  }
  /**
   * Check if online or simulated offline
   */
  isOffline(): boolean {
    if (typeof window === 'undefined') return false;
    const simulated = localStorage.getItem(STORAGE_KEYS.IS_OFFLINE_SIMULATED) === 'true';
    return simulated || !navigator.onLine;
  }

  setSimulatedOffline(value: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.IS_OFFLINE_SIMULATED, String(value));
  }

  getHighContrast(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST) === 'true';
  }

  setHighContrast(value: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(value));
  }

  getActiveUser(): UserPersona {
    if (typeof window === 'undefined') return INITIAL_USERS[0];
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_USERS[0];
  }

  setActiveUser(user: UserPersona) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
  }

  getUsers(): UserPersona[] {
    if (typeof window === 'undefined') return INITIAL_USERS;
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!saved) {
      this.saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    try {
      const users: UserPersona[] = JSON.parse(saved);
      // Ensure Kanishka admin always exists
      if (!users.some(u => u.role === 'ADMIN_IBT')) {
        const merged = [INITIAL_USERS[0], ...users.filter(u => u.id !== 'USR-KANISHKA')];
        this.saveUsers(merged);
        return merged;
      }
      return users;
    } catch {
      return INITIAL_USERS;
    }
  }

  saveUsers(users: UserPersona[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    pushUsersToFirestore(users).catch((err) =>
      console.warn('[Firestore] Users sync failed:', err)
    );
  }

  addUser(user: Omit<UserPersona, 'id'>): UserPersona {
    const users = this.getUsers();
    const id = `USR-${Date.now().toString(36).toUpperCase()}`;
    const newUser: UserPersona = {
      ...user,
      id,
      isOnline: false,
      lastActive: 'Never',
      createdDate: new Date().toISOString().split('T')[0],
    };
    users.push(newUser);
    this.saveUsers(users);
    pushSingleUser(newUser).catch((err) =>
      console.warn('[Firestore] pushSingleUser failed:', err)
    );
    return newUser;
  }

  updateUser(updated: UserPersona): void {
    const users = this.getUsers().map(u => u.id === updated.id ? updated : u);
    this.saveUsers(users);
    pushSingleUser(updated).catch((err) =>
      console.warn('[Firestore] pushSingleUser failed:', err)
    );
    const active = this.getActiveUser();
    if (active.id === updated.id) {
      this.setActiveUser(updated);
    }
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const target = users.find(u => u.id === id);
    if (target?.role === 'ADMIN_IBT' || target?.id === 'USR-KANISHKA') {
      return false; // Cannot delete Super Admin Kanishka
    }
    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);
    deleteSingleUser(id).catch((err) =>
      console.warn('[Firestore] deleteSingleUser failed:', err)
    );
    return true;
  }

  /**
   * Real-Time Stream Inbound Setters (Updates local cache without re-triggering outgoing pushes)
   */
  setLiveInventory(items: InventoryItem[]): void {
    if (typeof window === 'undefined' || !items || items.length === 0) return;
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  }

  setLiveLedger(txs: LedgerTransaction[]): void {
    if (typeof window === 'undefined' || !txs) return;
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(txs));
  }

  setLiveUsers(users: UserPersona[]): void {
    if (typeof window === 'undefined' || !users || users.length === 0) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  setLiveCustomerIssuances(issuances: CustomerIssuance[]): void {
    if (typeof window === 'undefined' || !issuances) return;
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_ISSUANCES, JSON.stringify(issuances));
  }

  setLiveTransfers(transfers: StockTransfer[]): void {
    if (typeof window === 'undefined' || !transfers) return;
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }

  setUserOnlineStatus(userId: string, isOnline: boolean): void {
    const users = this.getUsers().map(u => {
      if (u.id === userId) {
        return {
          ...u,
          isOnline,
          lastActive: isOnline ? 'Just now' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return u;
    });
    this.saveUsers(users);
    const active = this.getActiveUser();
    if (active.id === userId) {
      this.setActiveUser({
        ...active,
        isOnline,
        lastActive: isOnline ? 'Just now' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  }

  getInventory(): InventoryItem[] {
    if (typeof window === 'undefined') return INITIAL_INVENTORY;
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!saved) {
      this.saveInventory(INITIAL_INVENTORY);
      return INITIAL_INVENTORY;
    }
    try {
      let items: InventoryItem[] = JSON.parse(saved);
      let needsSave = false;

      // Auto-migrate to guarantee the 17 TC-OPNC-C dostocks items are active
      const hasDostocksColl = items.some((i) => i.subCategory === 'TCOPNC-C' && i.materialCode === 'CPEFTH055S');
      if (!hasDostocksColl) {
        const withoutOldColl = items.filter((i) => i.subCategory !== 'TCOPNC-C');
        const collItems = INITIAL_INVENTORY.filter((i) => i.subCategory === 'TCOPNC-C');
        items = [...withoutOldColl, ...collItems];
        needsSave = true;
      }

      // Auto-migrate to guarantee the 31 TC-OPNC-R dostocks items are active
      const hasDostocksRet = items.some((i) => i.subCategory === 'TCOPNC-R' && i.materialCode === 'OSPACC016');
      if (!hasDostocksRet) {
        const withoutOldRet = items.filter((i) => i.subCategory !== 'TCOPNC-R');
        const retItems = INITIAL_INVENTORY.filter((i) => i.subCategory === 'TCOPNC-R');
        items = [...withoutOldRet, ...retItems];
        needsSave = true;
      }

      // Auto-migrate to guarantee the 86 TC-OPCDR official material verification items are active
      const hasDostocksReh = items.some((i) => i.subCategory === 'TC-OPCDR' && i.id === 'reh-86');
      if (!hasDostocksReh) {
        const withoutOldReh = items.filter((i) => i.subCategory !== 'TC-OPCDR');
        const rehItems = INITIAL_INVENTORY.filter((i) => i.subCategory === 'TC-OPCDR');
        items = [...withoutOldReh, ...rehItems];
        needsSave = true;
      }

      // Auto-migrate to guarantee the 10 TC-OPCDR-R official dostocks items are active
      const hasDostocksRehRet = items.some((i) => i.subCategory === 'TC-OPCDR-R' && i.id === 'reh-ret-10');
      if (!hasDostocksRehRet) {
        const withoutOldRehRet = items.filter((i) => i.subCategory !== 'TC-OPCDR-R');
        const rehRetItems = INITIAL_INVENTORY.filter((i) => i.subCategory === 'TC-OPCDR-R');
        items = [...withoutOldRehRet, ...rehRetItems];
        needsSave = true;
      }

      // Auto-migrate to guarantee the 56 TC-OPNC official dostocks items are active
      const hasDostocksNc = items.some((i) => i.subCategory === 'TCOPNC' && i.id === 'nc-56');
      if (!hasDostocksNc) {
        const withoutOldNc = items.filter((i) => i.subCategory !== 'TCOPNC');
        const ncItems = INITIAL_INVENTORY.filter((i) => i.subCategory === 'TCOPNC');
        items = [...withoutOldNc, ...ncItems];
        needsSave = true;
      }

            // Auto-migrate to purge all dummy mock serial numbers (e.g. SLT-COL-STB31-001) from existing browser storage
      const MIGRATION_WIPE_DUMMY_SERIALS = 'SLT_PURGE_DUMMY_SERIALS_2026_V1';
      if (!localStorage.getItem(MIGRATION_WIPE_DUMMY_SERIALS)) {
        items = items.map((item) => ({
          ...item,
          serialNumbers: [],
        }));
        needsSave = true;
        localStorage.setItem(MIGRATION_WIPE_DUMMY_SERIALS, 'true');
      }

            // 100% Fresh Clean Slate Production Start
      const MIGRATION_CLEAN_SLATE_PROD = 'SLT_CLEAN_SLATE_PROD_OCT2026_FINAL';
      if (!localStorage.getItem(MIGRATION_CLEAN_SLATE_PROD)) {
        localStorage.setItem(MIGRATION_CLEAN_SLATE_PROD, 'true');

        // 1. Reset inventory to INITIAL_INVENTORY with default quantities and empty serials
        items = INITIAL_INVENTORY.map((item) => ({
          ...item,
          serialNumbers: [],
        }));
        this.saveInventory(items);

        // 2. Clear all audit ledger records
        this.saveLedger([]);

        // 3. Clear all customer issuances
        this.saveCustomerIssuances([]);

        // 4. Clear all transfers & offline queue
        localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
        this.saveOfflineQueue([]);

        return items;
      }

      if (needsSave) {
        this.saveInventory(items);
      }
      return items;
    } catch {
      return INITIAL_INVENTORY;
    }
  }

  updateItemStockStages(itemId: string, stages: { quantity?: number; receiving?: number; inbound?: number }): InventoryItem[] {
    const items = this.getInventory();
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        ...stages,
        lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      this.saveInventory(items);
    }
    return items;
  }

  saveInventory(items: InventoryItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
    // Fire-and-forget Firestore sync
    pushInventoryToFirestore(items).catch((err) =>
      console.warn('[Firestore] Inventory sync failed:', err)
    );
  }

  getLedger(): LedgerTransaction[] {
    if (typeof window === 'undefined') return INITIAL_LEDGER;
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    if (!saved) {
      this.saveLedger(INITIAL_LEDGER);
      return INITIAL_LEDGER;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_LEDGER;
    }
  }

  saveLedger(txs: LedgerTransaction[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(txs));
    // Fire-and-forget Firestore sync
    pushLedgerToFirestore(txs).catch((err) =>
      console.warn('[Firestore] Ledger sync failed:', err)
    );
  }

  getOfflineQueue(): LedgerTransaction[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  saveOfflineQueue(queue: LedgerTransaction[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  }

  /**
   * Commit a transaction:
   * 1. Updates inventory counts and serials
   * 2. Adds transaction to ledger or offline queue
   */
  executeTransaction(txData: Omit<LedgerTransaction, 'id' | 'timestamp' | 'syncStatus'>): {
    transaction: LedgerTransaction;
    isQueuedOffline: boolean;
  } {
    const isOffline = this.isOffline();
    const syncStatus = isOffline ? 'QUEUED_OFFLINE' : 'SYNCED';
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timePart = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const datePart = txData.entryDate || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timestamp = `${datePart} ${timePart}`;

    const tx: LedgerTransaction = {
      ...txData,
      id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      syncStatus,
    };

    // Update Inventory
    const inventory = this.getInventory();
    const itemIndex = inventory.findIndex(
      (item) => item.materialCode.toUpperCase() === tx.materialCode.toUpperCase() && item.subCategory === tx.subCategory
    );

    if (itemIndex >= 0) {
      const item = { ...inventory[itemIndex] };
      item.quantity = Math.max(0, item.quantity + tx.quantityDelta);
      item.lastUpdated = timestamp.slice(0, 16);

      // Handle serialized devices (single serial or bulk batch array)
      const incomingSerials: string[] = tx.serialNumbers && tx.serialNumbers.length > 0
        ? tx.serialNumbers
        : (tx.serialNumber && !tx.serialNumber.includes('Devices (Batch Intake)') ? [tx.serialNumber] : []);

      if (incomingSerials.length > 0 || item.isSerialized) {
        if (incomingSerials.length > 0) {
          item.isSerialized = true;
        }
        const serials = item.serialNumbers ? [...item.serialNumbers] : [];
        if (tx.quantityDelta < 0) {
          // Remove serials on allocation/consumption/transfer
          incomingSerials.forEach((sn) => {
            const sIdx = serials.indexOf(sn);
            if (sIdx >= 0) serials.splice(sIdx, 1);
          });
        } else if (tx.quantityDelta > 0) {
          // Add serials on receive/return
          incomingSerials.forEach((sn) => {
            if (!serials.includes(sn)) {
              serials.push(sn);
            }
          });
        }
        item.serialNumbers = serials;
        // CRITICAL FIX: NEVER overwrite item.quantity with serials.length!
        // item.quantity is already accurately updated via item.quantity = Math.max(0, item.quantity + tx.quantityDelta)
      }
      inventory[itemIndex] = item;
    } else if (tx.quantityDelta > 0) {
      // Create new inventory item entry if new material received in this category
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        materialCode: tx.materialCode.toUpperCase(),
        description: tx.materialDescription || tx.materialCode,
        subCategory: tx.subCategory,
        mainCategory: tx.mainCategory,
        quantity: tx.quantityDelta,
        unit: (tx.unit as InventoryItem['unit']) || 'PCS',
        isSerialized: Boolean(tx.serialNumber),
        serialNumbers: [],
        minThreshold: 5,
        lastUpdated: timestamp.slice(0, 16),
        binLocation: tx.locatorId || 'DEFAULT-BIN',
      };
      inventory.push(newItem);
    }
    this.saveInventory(inventory);

    // Save to Ledger
    const ledger = this.getLedger();
    ledger.unshift(tx);
    this.saveLedger(ledger);

    // If offline, queue it for background sync
    if (isOffline) {
      const queue = this.getOfflineQueue();
      queue.push(tx);
      this.saveOfflineQueue(queue);
    }

    return { transaction: tx, isQueuedOffline: isOffline };
  }

  /**
   * Customer Issuances Management
   */
  getCustomerIssuances(): CustomerIssuance[] {
    if (typeof window === 'undefined') return INITIAL_CUSTOMER_ISSUANCES;
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_ISSUANCES);
    const MIGRATION_WIPE_ISSUANCE_SERIALS = 'SLT_PURGE_ISSUANCE_SERIALS_2026_V1';
    if (false as boolean) {
      localStorage.setItem(MIGRATION_WIPE_ISSUANCE_SERIALS, 'true');
      const base = saved ? JSON.parse(saved) : INITIAL_CUSTOMER_ISSUANCES;
      const cleaned = base.map((i: any) => ({ ...i, serialNumber: undefined }));
      this.saveCustomerIssuances(cleaned);
      return cleaned;
    }

    if (!saved) {
      this.saveCustomerIssuances(INITIAL_CUSTOMER_ISSUANCES);
      return INITIAL_CUSTOMER_ISSUANCES;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_CUSTOMER_ISSUANCES;
    }
  }

  saveCustomerIssuances(issuances: CustomerIssuance[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_ISSUANCES, JSON.stringify(issuances));
    // Fire-and-forget Firestore sync
    pushIssuancesToFirestore(issuances).catch((err) =>
      console.warn('[Firestore] Customer Issuances sync failed:', err)
    );
  }

  addCustomerIssuance(issuance: CustomerIssuance) {
    const list = this.getCustomerIssuances();
    list.unshift(issuance);
    this.saveCustomerIssuances(list);
  }

  /**
   * Process a customer equipment return / collection:
   * Per user requirement:
   * - "here collective means direct collect from the customer"
   * - "retunr means from the workshops return"
   * - "when the customer details clicked the return its directly need to add under the collective only (TCOPNC-C)"
   */
  processCustomerReturn(params: {
    issuanceId?: string;
    materialCode: string;
    materialDescription?: string;
    serialNumber?: string;
    quantity: number;
    unit?: string;
    returnType?: 'TCOPNC-C' | 'TCOPNC-R'; // Defaults to TCOPNC-C (Collective)
    returnDate: string; // YYYY-MM-DD
    itemCondition: 'GOOD_REUSABLE' | 'FAULTY_REPAIR' | 'SCRAP';
    accountNo: string;
    customerName: string;
    returnNotes?: string;
    operatorName: string;
    operatorId: string;
  }): { transaction: LedgerTransaction; updatedIssuance?: CustomerIssuance } {
    const {
      issuanceId,
      materialCode,
      materialDescription,
      serialNumber,
      quantity,
      unit = 'UNITS',
      returnType = 'TCOPNC-C', // Strictly Collective for direct customer returns!
      returnDate,
      itemCondition,
      accountNo,
      customerName,
      returnNotes,
      operatorName,
      operatorId,
    } = params;

    // 1. Update Customer Issuance in registry
    const issuances = this.getCustomerIssuances();
    let updatedIssuance: CustomerIssuance | undefined;
    const targetIdx = issuanceId 
      ? issuances.findIndex(i => i.id === issuanceId)
      : issuances.findIndex(i => 
          i.status === 'ACTIVE' && 
          ((serialNumber && i.serialNumber === serialNumber) || (i.accountNo === accountNo && i.materialCode === materialCode))
        );

    if (targetIdx >= 0) {
      issuances[targetIdx] = {
        ...issuances[targetIdx],
        status: 'RETURNED_DIRECT',
        returnDate,
        returnType,
        returnCondition: itemCondition,
        returnNotes,
        returnedBy: operatorName,
      };
      updatedIssuance = issuances[targetIdx];
      this.saveCustomerIssuances(issuances);
    }

    // 2. Direct stock credit into Collective (TCOPNC-C)
    const desc = materialDescription || (updatedIssuance?.materialDescription ?? materialCode);

    const result = this.executeTransaction({
      userId: operatorId,
      userName: operatorName,
      actionType: 'CUSTOMER_COLLECT',
      mainCategory: 'New Connection',
      subCategory: returnType, // 'TCOPNC-C'
      materialCode: materialCode.toUpperCase(),
      materialDescription: desc,
      quantityDelta: quantity,
      unit,
      serialNumber: serialNumber?.trim() || undefined,
      accountNo,
      customerName,
      entryDate: returnDate,
      itemCondition,
      reasonCode: 'Direct Customer Collection to Collective (TCOPNC-C)',
      notes: `Condition: ${itemCondition} | Directly collected from customer A/C ${accountNo} into Collective Stock (TCOPNC-C) | ${returnNotes || ''}`.trim(),
    });

    return { transaction: result.transaction, updatedIssuance };
  }

  /**
   * Product Management: Add New Product across any of the 5 categories
   */
  addProduct(
    itemData: Omit<InventoryItem, 'id' | 'lastUpdated'> & { id?: string },
    operatorName: string = 'Mr. Kanishka',
    operatorId: string = 'USR-KANISHKA'
  ): InventoryItem {
    const inventory = this.getInventory();
    const cleanCode = itemData.materialCode.toUpperCase().trim();
    
    // Check if item with same materialCode and subCategory already exists
    const existingIdx = inventory.findIndex(
      (i) => i.materialCode.toUpperCase() === cleanCode && i.subCategory === itemData.subCategory
    );

    const today = new Date().toISOString().slice(0, 10);
    let finalItem: InventoryItem;

    if (existingIdx >= 0) {
      // Merge / increase quantity
      const existing = inventory[existingIdx];
      const mergedSerials = itemData.serialNumbers
        ? Array.from(new Set([...(existing.serialNumbers || []), ...itemData.serialNumbers]))
        : existing.serialNumbers;

      finalItem = {
        ...existing,
        ...itemData,
        id: existing.id,
        quantity: existing.quantity + itemData.quantity,
        serialNumbers: mergedSerials,
        lastUpdated: today,
      };
      inventory[existingIdx] = finalItem;
    } else {
      finalItem = {
        ...itemData,
        id: itemData.id || `item-prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        materialCode: cleanCode,
        quantity: Math.max(0, itemData.quantity || 0),
        receiving: itemData.receiving || 0,
        inbound: itemData.inbound || 0,
        minThreshold: itemData.minThreshold ?? 5,
        binLocation: itemData.binLocation || 'BIN-01',
        lastUpdated: today,
      };
      inventory.unshift(finalItem);
    }

    this.saveInventory(inventory);

    // Audit log
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const tx: LedgerTransaction = {
      id: `TX-ADD-${Date.now()}`,
      timestamp,
      entryDate: today,
      userId: operatorId,
      userName: operatorName,
      actionType: 'PRODUCT_CREATE',
      mainCategory: finalItem.mainCategory,
      subCategory: finalItem.subCategory,
      materialCode: finalItem.materialCode,
      materialDescription: finalItem.description,
      quantityDelta: finalItem.quantity,
      unit: finalItem.unit,
      notes: `New product SKU added: ${finalItem.materialCode} in ${finalItem.subCategory} category (${finalItem.quantity} ${finalItem.unit}).`,
      syncStatus: this.isOffline() ? 'QUEUED_OFFLINE' : 'SYNCED',
    };

    const ledger = this.getLedger();
    ledger.unshift(tx);
    this.saveLedger(ledger);

    return finalItem;
  }

  /**
   * Product Management: Edit Product
   */
  updateProduct(
    id: string,
    updates: Partial<InventoryItem>,
    operatorName: string = 'Mr. Kanishka',
    operatorId: string = 'USR-KANISHKA'
  ): InventoryItem {
    const inventory = this.getInventory();
    const idx = inventory.findIndex((i) => i.id === id);
    if (idx < 0) {
      throw new Error(`Product with ID "${id}" was not found in active inventory.`);
    }

    const oldItem = inventory[idx];
    const oldQty = oldItem.quantity;
    const today = new Date().toISOString().slice(0, 10);

    const updatedItem: InventoryItem = {
      ...oldItem,
      ...updates,
      materialCode: (updates.materialCode || oldItem.materialCode).toUpperCase().trim(),
      lastUpdated: today,
    };

    // Preserves explicit quantity set by user

    inventory[idx] = updatedItem;
    this.saveInventory(inventory);

    const delta = (updatedItem.quantity ?? oldQty) - oldQty;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const tx: LedgerTransaction = {
      id: `TX-EDIT-${Date.now()}`,
      timestamp,
      entryDate: today,
      userId: operatorId,
      userName: operatorName,
      actionType: 'PRODUCT_UPDATE',
      mainCategory: updatedItem.mainCategory,
      subCategory: updatedItem.subCategory,
      materialCode: updatedItem.materialCode,
      materialDescription: updatedItem.description,
      quantityDelta: delta,
      unit: updatedItem.unit,
      notes: `Product updated: ${updatedItem.materialCode} (Stock changed by ${delta >= 0 ? '+' : ''}${delta} ${updatedItem.unit}).`,
      syncStatus: this.isOffline() ? 'QUEUED_OFFLINE' : 'SYNCED',
    };

    const ledger = this.getLedger();
    ledger.unshift(tx);
    this.saveLedger(ledger);

    return updatedItem;
  }

  /**
   * Product Management: Delete Product
   */
  deleteProduct(
    id: string,
    operatorName: string = 'Mr. Kanishka',
    operatorId: string = 'USR-KANISHKA'
  ): boolean {
    const inventory = this.getInventory();
    const target = inventory.find((i) => i.id === id);
    if (!target) return false;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timestamp = `${today} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const tx: LedgerTransaction = {
      id: `TX-DEL-${Date.now()}`,
      timestamp,
      entryDate: today,
      userId: operatorId,
      userName: operatorName,
      actionType: 'PRODUCT_DELETE',
      mainCategory: target.mainCategory,
      subCategory: target.subCategory,
      materialCode: target.materialCode,
      materialDescription: target.description,
      quantityDelta: -target.quantity,
      unit: target.unit,
      notes: `Product SKU deleted: ${target.materialCode} (${target.description}) removed from ${target.subCategory}.`,
      syncStatus: this.isOffline() ? 'QUEUED_OFFLINE' : 'SYNCED',
    };

    const updated = inventory.filter((i) => i.id !== id);
    this.saveInventory(updated);

    const ledger = this.getLedger();
    ledger.unshift(tx);
    this.saveLedger(ledger);

    return true;
  }

  /**
   * Inter-Branch & Inter-District Stock Transfers (Move Order #)
   */
  getTransfers(): StockTransfer[] {
    if (typeof window === 'undefined') return INITIAL_TRANSFERS;
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (!saved) {
      this.saveTransfers(INITIAL_TRANSFERS);
      return INITIAL_TRANSFERS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_TRANSFERS;
    }
  }

  saveTransfers(transfers: StockTransfer[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    // Fire-and-forget Firestore sync
    pushTransfersToFirestore(transfers).catch((err) =>
      console.warn('[Firestore] Transfers sync failed:', err)
    );
  }

  /**
   * Execute an Inter-Branch / Inter-District Transfer across any of the 5 categories
   * Decrements stock and creates an immutable Move Order record and Ledger transaction.
   */
  executeTransfer(params: {
    moveOrderNo: string;
    subCategory: SubCategoryCode;
    materialCode: string;
    quantity: number;
    serialNumbers?: string[];
    destinationDistrict: string;
    destinationBranch: string;
    dispatchOfficer: string;
    carrierVehicle?: string;
    notes?: string;
    transferDate?: string;
    operatorId?: string;
    operatorName?: string;
  }): { transfer: StockTransfer; transaction: LedgerTransaction } {
    const {
      moveOrderNo,
      subCategory,
      materialCode,
      quantity,
      serialNumbers = [],
      destinationDistrict,
      destinationBranch,
      dispatchOfficer,
      carrierVehicle,
      notes,
      transferDate = new Date().toISOString().slice(0, 10),
      operatorId = 'USR-KANISHKA',
      operatorName = 'Mr. Kanishka',
    } = params;

    if (!moveOrderNo || !moveOrderNo.trim()) {
      throw new Error('Move Order Number is mandatory for stock transfers.');
    }
    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than zero.');
    }

    const inventory = this.getInventory();
    const itemIndex = inventory.findIndex(
      (i) => i.subCategory === subCategory && i.materialCode.toUpperCase() === materialCode.toUpperCase().trim()
    );

    if (itemIndex < 0) {
      throw new Error(`Material "${materialCode}" was not found in category "${subCategory}".`);
    }

    const item = inventory[itemIndex];
    if (item.quantity < quantity) {
      throw new Error(
        `Insufficient on-hand stock for ${item.materialCode}. Available: ${item.quantity} ${item.unit}, Requested: ${quantity} ${item.unit}.`
      );
    }

    // Deduct stock
    item.quantity -= quantity;
    item.lastUpdated = transferDate;

    // Handle serials removal if serialized
    if (item.isSerialized && serialNumbers.length > 0) {
      const serialSet = new Set(serialNumbers);
      item.serialNumbers = (item.serialNumbers || []).filter((s) => !serialSet.has(s));
    }

    inventory[itemIndex] = item;
    this.saveInventory(inventory);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${transferDate} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Create StockTransfer object
    const transfer: StockTransfer = {
      id: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      moveOrderNo: moveOrderNo.trim().toUpperCase(),
      transferDate,
      timestamp,
      subCategory,
      mainCategory: item.mainCategory,
      materialCode: item.materialCode,
      materialDescription: item.description,
      quantity,
      unit: item.unit,
      isSerialized: item.isSerialized,
      serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined,
      destinationDistrict,
      destinationBranch,
      dispatchOfficer,
      carrierVehicle,
      notes: notes?.trim() || `Inter-branch stock transfer to ${destinationBranch} (${destinationDistrict}) under Move Order #${moveOrderNo.trim().toUpperCase()}.`,
      status: 'DISPATCHED',
    };

    const transfers = this.getTransfers();
    transfers.unshift(transfer);
    this.saveTransfers(transfers);

    // Write to immutable Audit Ledger
    const tx: LedgerTransaction = {
      id: `TX-TR-${Date.now()}`,
      timestamp,
      entryDate: transferDate,
      userId: operatorId,
      userName: operatorName,
      actionType: 'INTER_BRANCH_TRANSFER',
      mainCategory: item.mainCategory,
      subCategory: item.subCategory,
      materialCode: item.materialCode,
      materialDescription: item.description,
      quantityDelta: -quantity,
      unit: item.unit,
      serialNumber: serialNumbers.length > 0 ? serialNumbers.join(', ') : undefined,
      moveOrderNo: transfer.moveOrderNo,
      destinationDistrict,
      destinationBranch,
      notes: `Move Order #${transfer.moveOrderNo} to ${destinationBranch} (${destinationDistrict})${carrierVehicle ? ` | Carrier: ${carrierVehicle}` : ''}`,
      syncStatus: this.isOffline() ? 'QUEUED_OFFLINE' : 'SYNCED',
    };

    const ledger = this.getLedger();
    ledger.unshift(tx);
    this.saveLedger(ledger);

    return { transfer, transaction: tx };
  }

  /**
   * Sync all offline queued transactions when network is restored
   */
  syncOfflineQueue(): { syncedCount: number } {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { syncedCount: 0 };

    const ledger = this.getLedger();
    const syncedIds = new Set(queue.map(q => q.id));

    const updatedLedger = ledger.map(item => {
      if (syncedIds.has(item.id)) {
        return { ...item, syncStatus: 'SYNCED' as const };
      }
      return item;
    });

    this.saveLedger(updatedLedger);
    this.saveOfflineQueue([]);
    return { syncedCount: queue.length };
  }

  /**
   * Reset data to initial demo state
   */
  resetData() {
    this.saveInventory(INITIAL_INVENTORY);
    this.saveLedger(INITIAL_LEDGER);
    this.saveCustomerIssuances(INITIAL_CUSTOMER_ISSUANCES);
    this.saveTransfers(INITIAL_TRANSFERS);
    this.saveOfflineQueue([]);
  }

  /**
   * Authentication Session Management
   */
  getAuthSession(): { email: string; name: string; loggedInAt: string } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    // Compulsory fresh authentication on every browser refresh/reload
    return false;
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: UserPersona; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    let users = this.getUsers();
    let found = users.find(
      u => u.email.toLowerCase() === cleanEmail && (u.password || 'tech123') === cleanPass
    );

    // If not found in local cache, query live Firestore database directly
    if (!found) {
      try {
        const remoteUsers = await fetchUsersFromFirestore();
        if (remoteUsers && remoteUsers.length > 0) {
          this.setLiveUsers(remoteUsers);
          users = remoteUsers;
          found = users.find(
            u => u.email.toLowerCase() === cleanEmail && (u.password || 'tech123') === cleanPass
          );
        }
      } catch (err) {
        console.warn('[Firestore] Remote user verification error:', err);
      }
    }

    if (found) {
      this.setUserOnlineStatus(found.id, true);
      const updatedUser = { ...found, isOnline: true, lastActive: 'Just now' };

      const session = {
        email: cleanEmail,
        name: found.name,
        role: found.role,
        userId: found.id,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      this.setActiveUser(updatedUser);
      return { success: true, user: updatedUser };
    }

    return {
      success: false,
      error: 'Invalid SLT credentials. Please contact Kanishka IBT or Pranith (0774726136) for password reset.',
    };
  }

  logout(): void {
    const active = this.getActiveUser();
    if (active && active.id) {
      this.setUserOnlineStatus(active.id, false);
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch {
      // safe fallback
    }
  }

  /**
   * System Duplicate & Security Alerts
   */
  getSystemAlerts(): SystemAlert[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_ALERTS);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  saveSystemAlerts(alerts: SystemAlert[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SYSTEM_ALERTS, JSON.stringify(alerts));
  }

  addSystemAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'resolved'>): SystemAlert {
    const alerts = this.getSystemAlerts();
    const newAlert: SystemAlert = {
      ...alert,
      id: `ALT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    alerts.unshift(newAlert);
    this.saveSystemAlerts(alerts);
    return newAlert;
  }

  resolveSystemAlert(alertId: string, resolvedBy: string): void {
    const alerts = this.getSystemAlerts().map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          resolved: true,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
        };
      }
      return a;
    });
    this.saveSystemAlerts(alerts);
  }

  getUnreadAlertsCount(): number {
    return this.getSystemAlerts().filter(a => !a.resolved).length;
  }

  /**
   * 30-Day Audit Ledger Retention & Auto-Prune
   */
  /**
   * Check records older than N days without downloading or deleting
   */
  getLedgerRecordsOlderThan(days: number = 30): LedgerTransaction[] {
    const ledger = this.getLedger();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTime = cutoffDate.getTime();

    return ledger.filter((item) => {
      const itemTime = new Date(item.entryDate || item.timestamp).getTime();
      return !isNaN(itemTime) && itemTime < cutoffTime;
    });
  }

  /**
   * Reset database back to official fresh baseline with accurate on-hand stock
   */
  resetToFreshDatabase(): void {
    if (typeof window === 'undefined') return;
    const fresh = INITIAL_INVENTORY.map((item) => ({
      ...item,
      serialNumbers: [],
    }));
    this.saveInventory(fresh);
    this.saveLedger([]);
    this.saveCustomerIssuances([]);
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
    this.saveOfflineQueue([]);
  }

  /**
   * 30-Day Audit Ledger Retention & Auto-Prune (Only called on explicit user action)
   */
  pruneLedgerOlderThan(days: number = 30): { pruned: LedgerTransaction[]; remaining: LedgerTransaction[] } {
    const ledger = this.getLedger();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTime = cutoffDate.getTime();

    const pruned: LedgerTransaction[] = [];
    const remaining: LedgerTransaction[] = [];

    for (const item of ledger) {
      const itemTime = new Date(item.entryDate || item.timestamp).getTime();
      if (!isNaN(itemTime) && itemTime < cutoffTime) {
        pruned.push(item);
      } else {
        remaining.push(item);
      }
    }

    if (pruned.length > 0) {
      this.saveLedger(remaining);
    }

    return { pruned, remaining };
  }
}

export const storageService = new StorageService();

