import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Upload, Flashlight, AlertCircle, CheckCircle2, Scan } from 'lucide-react';
import { parseScannedCode, ScannedPaymentData } from '../lib/qrParser';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: ScannedPaymentData) => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess, showToast }: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedPaymentData | null>(null);
  
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-element';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setCameraError(null);
      setScannedResult(null);
      return;
    }

    // Initialize scanner after DOM renders element
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping QR scanner:', e);
      } finally {
        html5QrcodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      const element = document.getElementById(scannerContainerId);
      if (!element) return;

      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // Ignore transient frame scan errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        err?.message || 'Не вдалося отримати доступ до камери. Скористайтеся завантаженням фото QR-коду або тестом.'
      );
      setIsScanning(false);
    }
  };

  const handleDecoded = (decodedText: string) => {
    stopScanner();
    const parsed = parseScannedCode(decodedText);
    setScannedResult(parsed);
    showToast('Ne•OBank App Scanner', 'QR/Штрихкод розпізнано!', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(scannerContainerId);
      }
      const decodedText = await html5QrcodeRef.current.scanFile(file, true);
      handleDecoded(decodedText);
    } catch (err) {
      console.error('File scan error:', err);
      showToast('Сканер', 'На зображенні не знайдено QR або штрихкод', 'error');
    }
  };

  const toggleTorch = async () => {
    if (html5QrcodeRef.current && isScanning) {
      try {
        // @ts-ignore
        const capabilities = html5QrcodeRef.current.getRunningTrackCapabilities?.();
        if (capabilities?.torch) {
          // @ts-ignore
          await html5QrcodeRef.current.applyVideoConstraints({
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
        } else {
          showToast('Сканер', 'Спалах не підтримується пристроєм', 'info');
        }
      } catch (e) {
        console.warn(e);
        showToast('Сканер', 'Не вдалося переключити спалах', 'info');
      }
    }
  };

  const handleApplyResult = () => {
    if (scannedResult) {
      onScanSuccess(scannedResult);
      onClose();
    }
  };

  // Demo / Test IBAN QR Generator trigger for instant testing
  const handleTestDemoScan = () => {
    const demoIban = 'UA893000010000026001234567890';
    const demoQrString = `ST00012|Name=КП Київводоканал|IBAN=${demoIban}|Sum=250.50|Purpose=Оплата за водопостачання о/р 998877`;
    handleDecoded(demoQrString);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0B1220] border border-violet-500/40 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 relative">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-violet-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-violet-500/20 pb-3 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-violet-500/20 border border-violet-400/40 text-violet-300 flex items-center justify-center">
              <Scan className="w-5 h-5 animate-pulse text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Сканер QR / Штрихкоду
              </h3>
              <p className="text-[10px] text-violet-300/70">
                Автозаповнення реквізитів платежу
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner View / Result */}
        <div className="relative z-10 space-y-3">
          {scannedResult ? (
            <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-500/40 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center space-x-2 text-violet-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Дані успішно розпізнано!</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono bg-black/50 p-3 rounded-xl border border-violet-500/20">
                <div className="flex justify-between">
                  <span className="text-violet-200/60">Тип:</span>
                  <span className="text-violet-300 font-bold uppercase">{scannedResult.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-200/60">Реквізит:</span>
                  <span className="text-white font-bold truncate max-w-[170px]" title={scannedResult.targetNumber}>
                    {scannedResult.targetNumber}
                  </span>
                </div>
                {scannedResult.amount && (
                  <div className="flex justify-between">
                    <span className="text-violet-200/60">Сума:</span>
                    <span className="text-emerald-400 font-extrabold">{scannedResult.amount} ₴</span>
                  </div>
                )}
                {scannedResult.comment && (
                  <div className="flex justify-between">
                    <span className="text-violet-200/60">Призначення:</span>
                    <span className="text-violet-200 truncate max-w-[170px]" title={scannedResult.comment}>
                      {scannedResult.comment}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setScannedResult(null);
                    startScanner();
                  }}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
                >
                  Сканувати знову
                </button>
                <button
                  onClick={handleApplyResult}
                  className="py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs shadow-lg shadow-violet-500/20 transition"
                >
                  Заповнити формати
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Video Scanner Container */}
              <div className="relative rounded-2xl overflow-hidden bg-black border border-violet-500/30 min-h-[240px] flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full min-h-[240px]" />

                {/* Overlaid QR Frame Guide */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-violet-400/80 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)] relative animate-pulse">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-violet-300" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-violet-300" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-violet-300" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-violet-300" />
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-[#0F172A]/90 p-4 flex flex-col items-center justify-center text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <p className="text-xs text-white/90">{cameraError}</p>
                    <button
                      onClick={handleTestDemoScan}
                      className="px-3 py-1.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-violet-300 text-xs font-bold mt-2 hover:bg-violet-500/30 transition"
                    >
                      🧪 Симулювати QR IBAN (Тест)
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 rounded-xl bg-[#131B2E] border border-violet-500/20 hover:bg-[#1C2740] text-violet-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-violet-400" />
                  <span>Фото з галереї</span>
                </button>

                <button
                  onClick={toggleTorch}
                  disabled={!isScanning}
                  className="py-2.5 px-3 rounded-xl bg-[#131B2E] border border-violet-500/20 hover:bg-[#1C2740] text-amber-300 text-xs font-bold flex items-center justify-center transition disabled:opacity-40"
                  title="Увімкнути спалах"
                >
                  <Flashlight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTestDemoScan}
                  className="py-2.5 px-3 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300 hover:bg-violet-500/30 text-xs font-bold transition"
                  title="Тестовий сканування"
                >
                  🧪 Тест
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
