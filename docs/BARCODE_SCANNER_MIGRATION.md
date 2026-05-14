# Barcode Scanner Migration (Vision Camera → Camera Kit)

**Date:** 2026-05-14
**Affected file:** `src/features/inventory/components/BarcodeScannerModal.tsx`

## Why this change was made

The project previously used `react-native-vision-camera` and `react-native-vision-camera-barcode-scanner` (built on top of `react-native-nitro-modules` and `react-native-nitro-image`) to power barcode scanning in the inventory flow.

These libraries failed to build on **Xcode 26 / iOS 26 SDK** because the iOS 26 C++ standard library (`libc++`) added stricter availability annotations on `std::error_code` and `std::error_condition` constructors. The Nitro family of libraries uses those types in a pattern that Clang now rejects with errors like:

```
/error_code.h:49:3: note: function 'error_code' unavailable (cannot import)
/error_condition.h:56:3: note: function 'error_condition' unavailable (cannot import)
```

The result was a hard `xcodebuild` failure (`exit code 65`) during `npm run ios`, blocking iOS development on machines running Xcode 26.

## Packages changed

### Removed
- `react-native-vision-camera`
- `react-native-vision-camera-barcode-scanner`
- `react-native-nitro-image`
- `react-native-nitro-modules`

### Added
- `react-native-camera-kit` (v18.0.0)

Camera Kit is a mature, pure-native (Swift/Kotlin) camera library that exposes barcode scanning directly on its `Camera` component. It does not use Nitro, does not rely on advanced C++ patterns, and builds cleanly on Xcode 26.

## Behaviour preserved

The visible behaviour of the barcode scanner is unchanged:

- Same modal layout, header, close button, scan frame corners, hint bar, error banner.
- Same flow: open → request camera permission → scan → call `inventoryService.scanBarcode` → return result via `onScannedItem`.
- Same permission UX: shows "Allow Camera" before grant, "Open Settings" if denied.
- Same one-shot scanning behaviour (`scannedRef` guard prevents duplicate submissions).
- Same loading and error states.

## Code differences

### Imports
Before:
```ts
import {
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  CodeScanner,
  type Barcode,
} from 'react-native-vision-camera-barcode-scanner';
```
After:
```ts
import CameraKit, { Camera, CameraType } from 'react-native-camera-kit';
```

### Permission handling
Before — Vision Camera exposed a hook:
```ts
const { hasPermission, canRequestPermission, requestPermission } =
  useCameraPermission();
```
After — Camera Kit exposes an imperative API. We wrap it in component state so the modal can render the same three UI states (unknown / granted / denied):
```ts
type PermissionState = 'unknown' | 'granted' | 'denied';
const [permission, setPermission] = useState<PermissionState>('unknown');

const checkPermission = useCallback(async () => {
  const granted = await CameraKit.requestDeviceCameraAuthorization();
  setPermission(granted ? 'granted' : 'denied');
}, []);
```
`checkPermission` runs each time the modal becomes visible (mirrors the old `useEffect` behaviour).

### Device selection
Before — Vision Camera required explicit device lookup and a "no back camera" fallback:
```ts
const device = useCameraDevice('back');
if (!device) { /* render fallback */ }
```
After — Camera Kit takes a `cameraType` prop and handles missing devices internally. The "no back camera" branch was removed because Camera Kit raises an error event instead, which is already surfaced through the existing error banner.

### Scanner component
Before:
```tsx
<CodeScanner
  style={styles.scanner}
  isActive={visible && !loading}
  barcodeFormats={['all-formats']}
  onBarcodeScanned={handleBarcodeScanned}
  onError={scannerError => setError(scannerError.message)}
/>
```
After:
```tsx
<Camera
  style={styles.scanner}
  cameraType={CameraType.Back}
  scanBarcode={visible && !loading}
  showFrame={false}
  onReadCode={(event) => {
    const value = event.nativeEvent.codeStringValue;
    if (value) {
      void submitBarcode(value);
    }
  }}
/>
```
The custom scan-frame overlay (corner brackets) is preserved; `showFrame={false}` keeps Camera Kit from drawing its own frame on top.

## iOS configuration

No changes were required to `ios/Meds/Info.plist`. `NSCameraUsageDescription` was already present for the previous camera library and is still consumed by Camera Kit.

## Setup on a new machine

After cloning the repo:

```bash
pnpm install
echo "export NODE_BINARY=$(which node)" > ios/.xcode.env.local
cd ios && pod install
cd ..
npm run ios
```

`ios/.xcode.env.local` must be regenerated per machine — it is in `.gitignore` because it stores an absolute path to the local Node binary.

## Future considerations

If Marc Rousavy's Nitro/Vision Camera libraries publish a version compatible with Xcode 26 / iOS 26 SDK, the project can migrate back to vision-camera for richer features (frame processors, custom format selection, etc.). Until then, Camera Kit covers the inventory barcode scanning use case fully and keeps the iOS build green on the latest Xcode.
