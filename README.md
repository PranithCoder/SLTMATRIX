# SLT MatriX — Mobile Inventory & Field Asset Management System

**Prepared For:** SLT-MOBITEL Infrastructure  
**Client / Primary Stakeholder:** Mr. Kanishka (IBT)  
**Document Version Reference:** PRD v1.0 (Final)  

---

## 1. Overview & Business Purpose
The **SLT MatriX Mobile Inventory System** is an offline-first, mobile-responsive field and warehouse asset tracking web application built specifically for SLT-MOBITEL infrastructure teams. It eliminates manual ledger errors, prevents stock leakage, and delivers 100% end-to-end traceability across telecom assets from central depot dispatch down to individual customer installations.

---

## 2. Brand Identity & Design System
Strictly adheres to official **SLT-MOBITEL** corporate brand identity:
- **Primary Brand / Headers:** `SLT Deep Blue` (`#0056B3`)
- **Secondary Brand / Accents:** `Mobitel Lime Green` (`#43B02A`)
- **Highlight / Interactive:** `Cyan Electric Blue` (`#0099FF`)
- **Background / Surface:** `Clean Neutral Slate` (`#F8FAFC`)
- **Outdoor Sunlight Mode:** High-contrast toggle engineered for direct sunlight readability during outdoor field installations.
- **Mobile Thumb Zone Ergonomics:** Minimum 48px touch targets, fixed bottom navigation bar, and one-touch floating camera trigger.

---

## 3. Stock Categorization Architecture
Categorizes inventory into 2 operational pillars governing 5 sub-categories:

### 1. New Connection
- **`TCOPNC`** (Standard New Connection Material / Devices): Stock Decrease (`-`) upon allocation and assignment to Customer Account via camera scan.
- **`TCOPNC-R`** (Customer Returns): Stock Increase (`+`) upon receiving returned devices/items back into inventory.
- **`TCOPNC-C`** (Collective Stock / Recovery): Isolated Ledger (`+` / `-`) managed independently for batch recoveries and audit tracking.

### 2. Rehabilitation
- **`TC-OPCDR`** (New Material for Rehab Projects): Stock Increase (`+`) when received via Main Branch locator dispatches. Stock Decrease (`-`) when consumed via Work Order # (`WO#`).
- **`TC-OPCDR-R`** (Returned Material from Rehab Sites): Stock Increase (`+`) for reusable/rehabbed materials returned from field locations.

---

## 4. Standard Batch Code / Locator Parsing System
Automatically parses incoming Main Branch dispatch tags:
```
TC-01-REH-250104-999 | OSPFIT002 | AERIAL CABLE FITTING - SHARP ANGLED
```
- **Code Segment 1:** `TC-01-REH-250104-999` — Dispatch batch, warehouse bin, and arrival date. Auto-triggers stock `INCREASE (+)` in designated category.
- **Code Segment 2:** `OSPFIT002` — Material Code (SKU master ID in SLT ERP catalog).
- **Code Segment 3:** `AERIAL CABLE FITTING - SHARP ANGLED` — Human-readable item title and specification.

---

## 5. Key Operational Workflows

### Workflow A: Serialized Device Allocation (`TCOPNC`)
For high-value equipment (ONTs, Routers, STBs):
1. **Open Mobile Camera** -> Field technician launches scanner.
2. **Scan Serial No.** -> Auto-captures and validates S/N against in-stock inventory.
3. **Enter Customer Info** -> Input Account No. (e.g., `0112458990`) & Customer Name.
4. **Execute & Deduct** -> Stock reduced in `TCOPNC` with full immutable audit record.

### Workflow B: Non-Serialized Material Allocation (`TC-OPCDR`)
For bulk rehabilitation materials (drop cables, aerial fittings, clamps, enclosures):
1. Select sub-category `TC-OPCDR`.
2. Select Material Code (e.g. `OSPFIT002`) and enter consumed Quantity.
3. Mandatory prompt for **Work Order Number (`WO#`)**.
4. Automatically decreases stock (`-`) from Rehabilitation stock.

### Workflow C: Item Returns & Recoveries (`TCOPNC-R` & `TC-OPCDR-R`)
1. Select `TCOPNC-R` (Customer Premise Return) or `TC-OPCDR-R` (Field Rehab Recovery).
2. Scan serial numbers or enter quantities along with return reason and physical condition grading (Good/Reusable, Faulty, Scrap).
3. Automatically increases stock (`+`) under segregated return ledgers.

---

## 6. Technical & System Features
- **Mobile Camera Barcode & QR Scanner:** WebRTC / HTML5 camera API supporting 1D/2D scanning (Code 128, QR Code, DataMatrix) with flash toggle, audio scan beep, haptic feedback, and 1-click test simulation presets.
- **Offline-First Storage & Auto-Sync:** IndexedDB / LocalStorage offline caching with a dedicated pending sync queue and instant reconnect flush.
- **Executive Dashboard for Mr. Kanishka (IBT):** Real-time stock counts across all categories, serial number direct lookup, low stock alerts, and CSV / printable audit report exports.
- **100% Immutable Ledger:** Timestamped trail capturing User ID, Action Type, Category, Serial #, Account #, Work Order #, and Quantity delta.

---

## Running the Application Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
