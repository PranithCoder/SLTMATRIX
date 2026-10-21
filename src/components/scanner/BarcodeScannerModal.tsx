import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Camera,
  Keyboard,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Zap,
  ZapOff,
  ZoomIn,
  Upload,
  Layers,
  Check,
  Trash2,
  ListPlus,
  Scan,
} from 'lucide-react';
import { audioFeedback } from '../../services/audioService';
import {
  extractSerialNumber,
  parseBarcode,
  rankBarcodeCandidates,
  findEquipmentByBarcode,
} from '../../utils/barcodeParser';
import { InventoryItem } from '../../types/inventory';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (
    scannedText: string,
    suggestedAction?: 'ALLOCATION' | 'REHAB' | 'DISPATCH' | 'RETURN',
    allScanned?: string[]
  ) => void;
  targetHint?: string;
  inventory?: InventoryItem[];
  initialBatchMode?: boolean;
}

// Complete Universal barcode formats supported across telecom hardware & electronics
// Covers every 1D and 2D barcode specification
const TARGET_FORMATS: Html5QrcodeSupportedFormats[] = [
  // 1D Linear Barcodes (Hardware serials, routers, switches, cartons, shipping tags)
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.RSS_14,
  Html5QrcodeSupportedFormats.RSS_EXPANDED,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,

  // 2D Matrix Barcodes (modern routers, ONTs, PCBs, packaging)
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.MAXICODE,
];

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  targetHint = 'Align Any Barcode or QR Code to capture Serial Number',
  inventory = [],
  initialBatchMode = false,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedSuccessText, setScannedSuccessText] = useState<string | null>(null);
  const [scannedDetails, setScannedDetails] = useState<string | null>(null);

  // Batch Scan Mode State (continuous scanning of multiple serials)
  const [isBatchMode, setIsBatchMode] = useState<boolean>(initialBatchMode);
  const [batchSerials, setBatchSerials] = useState<string[]>([]);
  const lastScanTimestampRef = useRef<{ [code: string]: number }>({});

  // Hardware controls state
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [detectedCandidates, setDetectedCandidates] = useState<Array<{ text: string; format: string }>>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStartingRef = useRef(false);
  const isScanningRef = useRef(false);
  const nativeIntervalRef = useRef<number | null>(null);
  const scannerContainerId = 'slt-barcode-reader';

  // Comprehensive telecom & network equipment presets across all manufacturers
  const DEMO_PRESETS = [
    {
      label: 'Huawei ONT Serial (Code 128)',
      code: '48575443F8B310A4',
      action: 'ALLOCATION' as const,
      brand: 'Huawei',
    },
    {
      label: 'ZTE Router GPON SN (Code 39)',
      code: 'ZTEGC8217391',
      action: 'ALLOCATION' as const,
      brand: 'ZTE',
    },
    {
      label: 'Nokia ONT Serial (Code 128)',
      code: 'ALCLB8341902',
      action: 'ALLOCATION' as const,
      brand: 'Nokia',
    },
    {
      label: 'FiberHome ONT Serial (Code 128)',
      code: 'FHTT8391024',
      action: 'ALLOCATION' as const,
      brand: 'FiberHome',
    },
    {
      label: 'Cisco Enterprise Switch SN (Code 128)',
      code: 'SLT-CISCO-1121X-01',
      action: 'ALLOCATION' as const,
      brand: 'Cisco',
    },
    {
      label: 'TP-Link ADSL Router (Code 128)',
      code: 'SLT-RTR-TP8951-01',
      action: 'ALLOCATION' as const,
      brand: 'TP-Link',
    },
    {
      label: 'Prolink ADSL Router (Code 128)',
      code: 'SLT-RTR-PL1140-01',
      action: 'ALLOCATION' as const,
      brand: 'Prolink',
    },
    {
      label: 'Aruba Unified AP S/N (Code 128)',
      code: 'SLT-AP-ARUBA303-01',
      action: 'ALLOCATION' as const,
      brand: 'Aruba',
    },
    {
      label: 'Fortinet FortiGate Firewall SN',
      code: 'SLT-FG40F-01',
      action: 'ALLOCATION' as const,
      brand: 'Fortinet',
    },
    {
      label: 'Huawei PCB Micro DataMatrix',
      code: '2102353GBH10M4000123',
      action: 'ALLOCATION' as const,
      brand: 'DataMatrix',
    },
    {
      label: 'Label with S/N Prefix (S/N: ...)',
      code: 'S/N: HWTC9842105B',
      action: 'ALLOCATION' as const,
      brand: 'Prefixed S/N',
    },
    {
      label: 'Alphanumeric Serial Tag (Code 39)',
      code: 'SN-RTR-GENERIC-889',
      action: 'ALLOCATION' as const,
      brand: 'Generic',
    },
    {
      label: 'Batch Locator Tag (Rehab Fitting)',
      code: 'TC-01-REH-250104-999 | OSPFIT002 | AERIAL CABLE FITTING',
      action: 'DISPATCH' as const,
      brand: 'Locator Tag',
    },
    {
      label: 'Work Order Barcode (Rehab)',
      code: 'WO-2025-09941',
      action: 'REHAB' as const,
      brand: 'Rehab WO',
    },
    {
      label: 'Customer Return ONT Serial',
      code: 'SLT-ONT-RET-111',
      action: 'RETURN' as const,
      brand: 'Returns',
    },
  ];

  const stopScanner = async () => {
    isScanningRef.current = false;
    if (nativeIntervalRef.current) {
      clearInterval(nativeIntervalRef.current);
      nativeIntervalRef.current = null;
    }
    if (videoTrackRef.current) {
      try {
        if (isTorchOn) {
          await (videoTrackRef.current as any).applyConstraints({
            advanced: [{ torch: false }],
          });
        }
      } catch {
        // Ignored
      }
      videoTrackRef.current = null;
    }
    setHasTorch(false);
    setIsTorchOn(false);
    setHasZoom(false);
    setCurrentZoom(1);
    setDetectedCandidates([]);

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const handleSuccessfulScan = useCallback(
    (codeText: string, suggestedAction?: 'ALLOCATION' | 'REHAB' | 'DISPATCH' | 'RETURN') => {
      const raw = (codeText || '').trim();
      if (!raw) return;

      // Extract clean serial number from barcode (supports ANY model, prefix, or 2D structure)
      const parsed = parseBarcode(raw);
      const cleanSerial = parsed.serialNumber || extractSerialNumber(raw) || raw;

      // Debounce duplicate scans within 1.5 seconds in Batch Mode
      const now = Date.now();
      const lastScannedAt = lastScanTimestampRef.current[cleanSerial] || 0;
      if (isBatchMode && now - lastScannedAt < 1500) {
        return;
      }
      lastScanTimestampRef.current[cleanSerial] = now;

      // Audio feedback
      audioFeedback.playScanSuccess();

      // Equipment match detection
      const match = findEquipmentByBarcode(cleanSerial, inventory);
      let detailsMsg = `S/N: ${cleanSerial}`;
      if (match.item) {
        detailsMsg = `Auto-Identified: ${match.item.materialCode} (${match.item.description}) • ${match.item.subCategory}`;
      } else if (parsed.detectedBrand) {
        detailsMsg = `${parsed.detectedBrand} Equipment • S/N: ${cleanSerial}`;
      }

      setScannedSuccessText(cleanSerial);
      setScannedDetails(detailsMsg);

      // Auto-detect action if not provided
      let action = suggestedAction;
      if (!action) {
        if (cleanSerial.includes('|') || cleanSerial.includes('TC-01')) {
          action = 'DISPATCH';
        } else if (cleanSerial.includes('RET')) {
          action = 'RETURN';
        } else if (cleanSerial.startsWith('WO-')) {
          action = 'REHAB';
        } else {
          action = 'ALLOCATION';
        }
      }

      if (isBatchMode) {
        // In Batch Mode, append to list and keep scanning!
        setBatchSerials((prev) => {
          if (prev.includes(cleanSerial)) return prev;
          return [...prev, cleanSerial];
        });
        // Clear flash after 1.2s to continue scanning next item
        setTimeout(() => {
          setScannedSuccessText((curr) => (curr === cleanSerial ? null : curr));
          setScannedDetails(null);
        }, 1200);
      } else {
        // Single Scan Mode: close and notify
        stopScanner();
        setTimeout(() => {
          onScanComplete(cleanSerial, action, [cleanSerial]);
          onClose();
        }, 400);
      }
    },
    [isBatchMode, inventory, onClose, onScanComplete]
  );

  const handleFinishBatch = () => {
    if (batchSerials.length === 0) {
      onClose();
      return;
    }
    const lastSerial = batchSerials[batchSerials.length - 1];
    stopScanner();
    onScanComplete(lastSerial, 'ALLOCATION', batchSerials);
    onClose();
  };

  const handleRemoveBatchItem = (serialToRemove: string) => {
    setBatchSerials((prev) => prev.filter((s) => s !== serialToRemove));
  };

  const handleClearBatch = () => {
    setBatchSerials([]);
    lastScanTimestampRef.current = {};
  };

  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    try {
      const next = !isTorchOn;
      await (videoTrackRef.current as any).applyConstraints({
        advanced: [{ torch: next }],
      });
      setIsTorchOn(next);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  const applyZoom = async (zoomLevel: number) => {
    if (!videoTrackRef.current) return;
    try {
      await (videoTrackRef.current as any).applyConstraints({
        advanced: [{ zoom: zoomLevel }],
      });
      setCurrentZoom(zoomLevel);
    } catch (err) {
      console.warn('Zoom apply error:', err);
    }
  };

  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    try {
      setCameraError(null);
      setScannedSuccessText(null);
      setScannedDetails(null);
      setDetectedCandidates([]);
      await stopScanner();

      // Check for HTTPS / Localhost
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!window.isSecureContext && !isLocalHost) {
        throw new Error(`Mobile browsers require HTTPS. Access via https://${window.location.host}`);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported by your browser.');
      }

      // Small pause for DOM container to mount
      await new Promise((r) => setTimeout(r, 120));

      const el = document.getElementById(scannerContainerId);
      if (!el) return;

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: TARGET_FORMATS,
        verbose: false,
        useBarCodeDetectorIfSupported: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = html5QrCode;

      // Start BACK camera with Full HD 1080p ideal resolution
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          disableFlip: false,
        },
        (decodedText) => handleSuccessfulScan(decodedText),
        () => {}
      );

      isScanningRef.current = true;

      // Inspect active video track for hardware features (torch, zoom, continuous autofocus)
      setTimeout(async () => {
        try {
          const video = document.querySelector(`#${scannerContainerId} video`) as HTMLVideoElement | null;
          if (video && video.srcObject) {
            const stream = video.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            if (track) {
              videoTrackRef.current = track;
              const caps: any = typeof track.getCapabilities === 'function' ? track.getCapabilities() : null;
              if (caps) {
                if (caps.torch) {
                  setHasTorch(true);
                }
                if (caps.zoom) {
                  setHasZoom(true);
                }
              }

              // Apply continuous autofocus if supported
              if (typeof track.applyConstraints === 'function') {
                try {
                  await track.applyConstraints({
                    advanced: [{ focusMode: 'continuous' } as any],
                  });
                } catch {
                  // Unsupported
                }
              }
            }
          }
        } catch (e) {
          console.warn('Track inspection note:', e);
        }
      }, 300);

      // Multi-engine hardware BarcodeDetector on raw 1080p video element
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          let detector: any = null;

          if (typeof BarcodeDetectorClass.getSupportedFormats === 'function') {
            const supported: string[] = await BarcodeDetectorClass.getSupportedFormats();
            detector = new BarcodeDetectorClass({ formats: supported });
          } else {
            detector = new BarcodeDetectorClass();
          }

          if (detector) {
            nativeIntervalRef.current = window.setInterval(async () => {
              if (!isScanningRef.current) return;
              const video = document.querySelector(`#${scannerContainerId} video`) as HTMLVideoElement | null;
              if (video && video.readyState >= 2 && !video.paused) {
                try {
                  const detected = await detector.detect(video);
                  if (detected && detected.length > 0) {
                    if (detected.length === 1 && detected[0].rawValue) {
                      handleSuccessfulScan(detected[0].rawValue);
                    } else if (detected.length > 1) {
                      const valid = detected
                        .map((d: any) => ({ text: (d.rawValue || '').trim(), format: d.format || 'BARCODE' }))
                        .filter((c: any) => c.text.length > 0);

                      // Rank candidates using universal serial number parser
                      const ranked = rankBarcodeCandidates(valid, inventory);
                      if (ranked.length > 0) {
                        const top = ranked[0];
                        // If top candidate has high confidence score, automatically capture it
                        if (top.score >= 30) {
                          handleSuccessfulScan(top.text);
                        } else {
                          // Otherwise display candidates for user disambiguation
                          setDetectedCandidates(
                            ranked.slice(0, 4).map((r) => ({
                              text: r.serialNumber || r.text,
                              format: `${r.label}`,
                            }))
                          );
                        }
                      }
                    }
                  }
                } catch {
                  // Frame decode error ignored
                }
              }
            }, 90);
          }
        } catch (e) {
          console.warn('Native BarcodeDetector init note:', e);
        }
      }
    } catch (err: unknown) {
      console.warn('Rear camera start error:', err);
      let msg = 'Back camera unavailable.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }

      if (msg.includes('Permission') || msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        msg = 'Camera permission denied. Tap the lock/tune icon in the browser address bar to allow camera access, then retry.';
      } else if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        msg = `Camera requires HTTPS. Access via https://${window.location.host} and accept the certificate.`;
      }
      setCameraError(msg);
    } finally {
      isStartingRef.current = false;
    }
  }, [handleSuccessfulScan, inventory]);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    startCamera();

    return () => {
      stopScanner();
    };
  }, [isOpen, startCamera]);

  // Handle Photo / Snap upload fallback for difficult/scratched stickers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      // 1. Try native BarcodeDetector on uploaded image
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          const detector = new BarcodeDetectorClass();
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.src = url;
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
          const detected = await detector.detect(img);
          URL.revokeObjectURL(url);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            handleSuccessfulScan(detected[0].rawValue);
            setIsProcessingFile(false);
            return;
          }
        } catch {
          // Fall through
        }
      }

      // 2. Fall back to html5-qrcode file scanner
      await stopScanner();
      const tempScanner = new Html5Qrcode('slt-temp-scan-box', {
        formatsToSupport: TARGET_FORMATS,
        verbose: false,
      });
      const decodedResult = await tempScanner.scanFile(file, false);
      tempScanner.clear();
      if (decodedResult) {
        handleSuccessfulScan(decodedResult);
      } else {
        alert('Could not decode a clear barcode from this image. Please ensure good lighting and focus.');
        startCamera();
      }
    } catch (err) {
      console.warn('File scan error:', err);
      alert('Could not decode barcode from photo. Please ensure the label is in focus and well lit.');
      startCamera();
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, padding: 0, overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: 'var(--slt-deep-blue)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scan size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 700, margin: 0 }}>
                Universal Barcode &amp; Serial Scanner
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#BAE6FD', fontWeight: 500, margin: 0 }}>
                All Equipment &amp; Models • 1D/2D Barcodes • Code 128, Code 39, QR, DataMatrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: '#FFFFFF',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#0F172A',
            minHeight: 280,
            maxHeight: 380,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* html5-qrcode live video container */}
          <div id={scannerContainerId} style={{ width: '100%' }} />

          {/* Hidden container for temp file scan */}
          <div id="slt-temp-scan-box" style={{ display: 'none' }} />

          {/* Active Laser Sweep */}
          <div className="scanner-laser" />

          {/* Aiming Reticle Frame */}
          <div
            style={{
              position: 'absolute',
              width: '84%',
              height: '68%',
              border: '2px solid rgba(0, 229, 255, 0.4)',
              borderRadius: 14,
              pointerEvents: 'none',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.15)',
            }}
          >
            <div className="scanner-corner top-left" />
            <div className="scanner-corner top-right" />
            <div className="scanner-corner bottom-left" />
            <div className="scanner-corner bottom-right" />
          </div>

          {/* Target Hint Pill */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 12,
              zIndex: 20,
              background: 'rgba(0, 86, 179, 0.88)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {targetHint}
          </div>

          {/* Hardware Controls Overlay: Torch + Zoom Buttons */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              zIndex: 25,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                title={isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
                style={{
                  background: isTorchOn ? '#F59E0B' : 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 'var(--radius-full)',
                  color: '#FFFFFF',
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                {isTorchOn ? <ZapOff size={14} /> : <Zap size={14} />}
                <span>{isTorchOn ? 'Flash ON' : 'Flash'}</span>
              </button>
            )}

            {hasZoom && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  overflow: 'hidden',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {[1, 2, 3].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => applyZoom(z)}
                    style={{
                      background: currentZoom === z ? 'var(--slt-deep-blue)' : 'transparent',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontWeight: currentZoom === z ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {z}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Multiple Barcodes Detected Banner (Disambiguation) */}
          {detectedCandidates.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                zIndex: 35,
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #00E5FF',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                backdropFilter: 'blur(6px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#00E5FF', fontWeight: 700 }}>
                <Layers size={13} />
                <span>Multiple Barcodes Found on Device (Tap to Pick):</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {detectedCandidates.map((cand, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuccessfulScan(cand.text)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid #BAE6FD',
                      borderRadius: 6,
                      color: '#FFFFFF',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#00E5FF', marginRight: 4 }}>{cand.format}:</span>
                    {cand.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scanned Success Flash Banner */}
          {scannedSuccessText && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 40,
                backgroundColor: 'rgba(5, 150, 105, 0.94)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                gap: 8,
                padding: 20,
                textAlign: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              <CheckCircle2 size={42} color="#FFFFFF" />
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Serial Number Captured!</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  padding: '6px 16px',
                  borderRadius: 6,
                  maxWidth: '90%',
                  wordBreak: 'break-all',
                  letterSpacing: '0.5px',
                }}
              >
                {scannedSuccessText}
              </div>
              {scannedDetails && (
                <div style={{ fontSize: '0.78rem', color: '#BAE6FD', maxWidth: '85%' }}>
                  {scannedDetails}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Camera Error Notice with Retry */}
        {cameraError && (
          <div
            style={{
              margin: '10px 16px 0',
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: '0.8rem',
              color: '#991B1B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, lineHeight: 1.45 }}>{cameraError}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 28 }}>
              <button
                type="button"
                onClick={startCamera}
                className="btn btn-outline"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderColor: '#DC2626',
                  color: '#DC2626',
                }}
              >
                <RefreshCw size={13} style={{ marginRight: 4 }} />
                Retry Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderColor: 'var(--slt-deep-blue)',
                  color: 'var(--slt-deep-blue)',
                }}
              >
                <Upload size={13} style={{ marginRight: 4 }} />
                Upload Photo Instead
              </button>
            </div>
          </div>
        )}

        {/* Mode Selector & Photo Upload Strip */}
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: '#F1F5F9',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Mode Switch: Single Scan vs Continuous Batch Scan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Scan Mode:
            </span>
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: '#E2E8F0',
                borderRadius: 'var(--radius-full)',
                padding: 2,
              }}
            >
              <button
                type="button"
                onClick={() => setIsBatchMode(false)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: !isBatchMode ? 700 : 500,
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: !isBatchMode ? 'var(--slt-deep-blue)' : 'transparent',
                  color: !isBatchMode ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Single Scan
              </button>
              <button
                type="button"
                onClick={() => setIsBatchMode(true)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: isBatchMode ? 700 : 500,
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isBatchMode ? 'var(--slt-deep-blue)' : 'transparent',
                  color: isBatchMode ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s',
                }}
              >
                <ListPlus size={13} />
                <span>Continuous Batch</span>
                {batchSerials.length > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--mobitel-lime)',
                      color: 'var(--slt-deep-blue)',
                      padding: '1px 5px',
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: '0.65rem',
                    }}
                  >
                    {batchSerials.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Photo File Fallback */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              disabled={isProcessingFile}
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                height: 28,
                borderColor: '#CBD5E1',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Upload size={13} style={{ marginRight: 4 }} />
              {isProcessingFile ? 'Decoding Photo...' : 'Snap / Upload Photo'}
            </button>
          </div>
        </div>

        {/* Batch Serials Tray (Visible in Batch Mode) */}
        {isBatchMode && (
          <div
            style={{
              padding: '10px 18px',
              backgroundColor: '#EFF6FF',
              borderBottom: '1px solid #BFDBFE',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40AF' }}>
                📦 Batch Scanned Serials ({batchSerials.length} items collected):
              </div>
              {batchSerials.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBatch}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={12} />
                  Clear List
                </button>
              )}
            </div>

            {batchSerials.length === 0 ? (
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                Keep pointing the camera at device barcodes. Each barcode will beep and add the serial number here.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  maxHeight: 90,
                  overflowY: 'auto',
                  padding: 4,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 6,
                  border: '1px solid #DBEAFE',
                }}
              >
                {batchSerials.map((sn, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  >
                    #{idx + 1}: {sn}
                    <button
                      type="button"
                      onClick={() => handleRemoveBatchItem(sn)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: 2,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {batchSerials.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleFinishBatch}
                  className="btn btn-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--slt-deep-blue)',
                  }}
                >
                  <Check size={14} style={{ marginRight: 4 }} />
                  Apply All {batchSerials.length} Scanned Serials
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Barcode Keyboard Entry Form */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-color)' }}>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type / Paste Any Barcode or Serial (e.g. SN: 123456)..."
                className="input-field mono"
                style={{ height: 40, paddingLeft: 38 }}
              />
              <Keyboard
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: 11,
                  color: 'var(--text-muted)',
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ minHeight: 40, padding: '0 16px' }}>
              Submit
            </button>
          </form>
        </div>

        {/* Multi-Brand Telecom Hardware Presets (1-Click Instant Simulators) */}
        <div style={{ padding: '10px 18px 14px', backgroundColor: '#F8FAFC' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              <Sparkles size={14} color="var(--mobitel-lime)" />
              <span>Universal Hardware Barcode Simulators (All Models &amp; Brands):</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              1-Click Instant Field Test
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 6,
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            {DEMO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuccessfulScan(preset.code, preset.action)}
                className="btn btn-outline"
                style={{
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  minHeight: 34,
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  borderColor: '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '1px 4px',
                        backgroundColor: '#EFF6FF',
                        color: 'var(--slt-deep-blue)',
                        borderRadius: 3,
                        fontWeight: 700,
                      }}
                    >
                      {preset.brand}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.72rem' }}>
                      {preset.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      marginTop: 2,
                    }}
                  >
                    {preset.code}
                  </div>
                </div>
                <CheckCircle2 size={14} color="var(--mobitel-lime)" style={{ flexShrink: 0, marginLeft: 4 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
