import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Upload, Flashlight, AlertCircle, CheckCircle2, Scan } from 'lucide-react';
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
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // Ignore transient frame errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        'Не вдалося автоматично відкрити камеру. Дозвольте доступ у налаштуваннях або завантажте знімок платіжки з галереї.'
      );
      setIsScanning(false);
    }
  };

  const handleDecoded = (decodedText: string) => {
    stopScanner();
    const parsed = parseScannedCode(decodedText);
    setScannedResult(parsed);
    showToast('NEO•N•BANK', 'QR-код платіжки розпізнано успішно!', 'success');
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
      showToast('НЕО•Н•БАНК', 'На завантаженому фото не знайдено QR-код або штрихкод', 'error');
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
          showToast('НЕО•Н•БАНК', 'Ліхтарик не підтримується цим пристроєм', 'info');
        }
      } catch (e) {
        console.warn(e);
        showToast('НЕО•Н•БАНК', 'Помилка під час керування ліхтариком', 'info');
      }
    }
  };

  const handleApplyResult = () => {
    if (scannedResult) {
      onScanSuccess(scannedResult);
      onClose();
    }
  };

  const handleTestDemoScan = () => {
    const demoIban = 'UA93805299357450301000000123';
    const demoQrString = `ST00012|Name=КП Київводоканал|IBAN=${demoIban}|Sum=450.00|Purpose=Оплата за комунальні послуги за липень|edrpou=26012345`;
    handleDecoded(demoQrString);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 relative">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center border border-cyan-400/20 font-bold">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider block">Зчитування платіжки</h3>
              <span className="text-[9px] text-zinc-500 block">Камера миттєво зчитає всі реквізити</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="space-y-4">
          {scannedResult ? (
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3.5 animate-fade-in">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Реквізити розпізнано!</span>
              </div>

              <div className="space-y-2 text-xs font-mono bg-black/60 p-3 rounded-xl border border-zinc-850">
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500 text-[10px] uppercase">Отримувач:</span>
                  <span className="text-white font-bold truncate max-w-[150px]">
                    {scannedResult.recipientName || (scannedResult.type === 'utility' ? 'Київводоканал' : scannedResult.type)}
                  </span>
                </div>
                {scannedResult.taxId && (
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 text-[10px] uppercase">ЄДРПОУ/ІПН:</span>
                    <span className="text-white font-bold truncate max-w-[150px]">
                      {scannedResult.taxId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500 text-[10px] uppercase">Реквізит:</span>
                  <span className="text-white font-mono truncate max-w-[150px]" title={scannedResult.targetNumber}>
                    {scannedResult.targetNumber}
                  </span>
                </div>
                {scannedResult.amount && (
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 text-[10px] uppercase">Сума:</span>
                    <span className="text-cyan-400 font-extrabold">{scannedResult.amount} ₴</span>
                  </div>
                )}
                {scannedResult.comment && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 text-[10px] uppercase">Призначення:</span>
                    <span className="text-zinc-300 truncate max-w-[150px]" title={scannedResult.comment}>
                      {scannedResult.comment}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScannedResult(null);
                    startScanner();
                  }}
                  className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold transition"
                >
                  Знову
                </button>
                <button
                  type="button"
                  onClick={handleApplyResult}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider transition"
                >
                  Підтвердити
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Native iOS feel camera viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-850 aspect-square flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full min-h-[260px] object-cover" />

                {/* Cyberpunk Laser Line and Corners */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Pulsating target box */}
                    <div className="w-56 h-56 border border-cyan-400/30 rounded-2xl relative shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                      {/* Corner guides */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-[6px]" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-[6px]" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-[6px]" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-[6px]" />
                      
                      {/* Laser red/cyan pulsing line */}
                      <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Background overlay info when error or loading */}
                {cameraError && (
                  <div className="absolute inset-0 bg-zinc-950/95 p-4 flex flex-col items-center justify-center text-center space-y-3 z-10">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <p className="text-xs text-zinc-400 font-semibold max-w-[200px] leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={handleTestDemoScan}
                      className="px-4 py-2 rounded-xl bg-cyan-400 text-zinc-950 text-xs font-black uppercase tracking-wider hover:bg-cyan-300 transition"
                    >
                      ⚡ Симулювати QR-код
                    </button>
                  </div>
                )}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2.5 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-zinc-300 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>З Галереї</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTorch}
                  disabled={!isScanning}
                  className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-amber-400 text-xs font-bold flex items-center justify-center transition disabled:opacity-30"
                  title="Ліхтарик"
                >
                  <Flashlight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleTestDemoScan}
                  className="py-3 px-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 text-xs font-black uppercase tracking-wider transition"
                  title="Миттєве тестування сканування"
                >
                  Тест
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
