# Meds — Pharmacy Management App

A **React Native** mobile application for pharmacy management, built with TypeScript. It provides a complete solution for POS billing, inventory tracking, order management, customer management, attendance, and reports — all backed by a Frappe/ERPNext-based REST API.

---

## Features

| Module | Description |
|---|---|
| **Authentication** | Email/password login, forgot password, session persistence via AsyncStorage |
| **Dashboard** | KPI cards, recent sales, quick actions, notifications |
| **POS (Point of Sale)** | Cart management, barcode scanning, customer picker, discount & GST calculation, payment methods, invoice generation & sharing |
| **Orders** | View and filter purchase/sales orders with detailed order summaries |
| **Inventory** | Browse medicines, add/remove stock, barcode-based lookup, medicine detail view |
| **Reports** | Sales and inventory reports with summary cards |
| **Attendance** | Staff attendance tracking and summary |
| **Settings** | Customer management, order history, user profile, theme selector, about screen |
| **Theming** | Light / Dark / System theme modes with a fully typed `AppTheme` |

---

## Tech Stack

| Category | Library / Version |
|---|---|
| Framework | React Native `0.85.2` |
| Language | TypeScript `^5.8.3` |
| State Management | Redux Toolkit `^2.11.2` + React Redux `^9.2.0` |
| Navigation | React Navigation v7 (Native Stack + Bottom Tabs) |
| Icons | Lucide React Native `^1.9.0` |
| Camera / Barcode | react-native-vision-camera `^5.0.9` + vision-camera-barcode-scanner `^5.0.9` |
| Storage | AsyncStorage `^3.0.2` |
| Safe Area | react-native-safe-area-context `^5.5.2` |
| SVG | react-native-svg `^15.15.4` |
| Node (required) | `>= 22.11.0` |

---

## Getting Started

### Prerequisites

- Node.js `>= 22.11.0`
- React Native CLI environment set up — see the [official guide](https://reactnative.dev/docs/set-up-your-environment)
- Xcode (iOS) or Android Studio (Android)

### Install dependencies

```sh
npm install
```

### iOS — install CocoaPods (first time or after native dep changes)

```sh
bundle install
bundle exec pod install
```

### Start Metro

```sh
npm start
```

### Run on device / simulator

```sh
# Android
npm run android

# iOS
npm run ios
```

---

## Environment / API

The app connects to a Frappe/ERPNext backend via ngrok tunnel. Base URLs are defined in:

- `src/features/authentication/services/authService.ts` — `LOGIN_URL`, `FORGOT_PASSWORD_URL`
- Individual feature service files under `src/features/*/services/`

Auth session (sid, apiKey, apiSecret, roles, etc.) is stored in AsyncStorage under the key `@meds/auth-session`.

---

## Project Structure

```
Meds/
├── App.tsx                         # Root component — Redux Provider, SafeAreaProvider, auth bootstrap gate
├── index.js                        # React Native entry point
├── app.json                        # App name & metadata
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── jest.config.js
├── android/                        # Android native project
├── ios/                            # iOS native project (Xcode workspace)
└── src/
    ├── app/
    │   ├── store.ts                # Redux store — combines all feature reducers
    │   └── hooks.ts                # Typed useAppDispatch / useAppSelector hooks
    │
    ├── navigation/
    │   ├── RootNavigator.tsx       # Auth gate: renders AuthNavigator or MainTabNavigator
    │   ├── AuthNavigator.tsx       # Stack: Login → ForgotPassword
    │   ├── MainTabNavigator.tsx    # Bottom tab bar (Home, POS, Orders, Inventory, More)
    │   ├── DashboardStack.tsx      # Dashboard → Notifications
    │   ├── POSStack.tsx            # POS → MedicineList
    │   ├── OrdersStack.tsx         # Orders → OrderHistory
    │   ├── InventoryStack.tsx      # Inventory → InventoryDetails
    │   ├── SettingsStack.tsx       # Settings → Customers / Profile / About / etc.
    │   ├── AttendanceStack.tsx     # Attendance screen
    │   ├── ReportsStack.tsx        # Reports screen
    │   └── types.ts                # Navigation param-list types
    │
    ├── features/
    │   ├── authentication/
    │   │   ├── screens/
    │   │   │   ├── LoginScreen.tsx
    │   │   │   └── ForgotPasswordScreen.tsx
    │   │   ├── components/
    │   │   │   └── AuthWelcomeCard.tsx
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts
    │   │   ├── services/
    │   │   │   └── authService.ts  # login(), forgotPassword(), authStorage (AsyncStorage)
    │   │   └── store/
    │   │       └── authSlice.ts    # bootstrapAuth thunk, login/logout actions
    │   │
    │   ├── dashboard/
    │   │   ├── screens/
    │   │   │   ├── DashboardScreen.tsx
    │   │   │   └── NotificationsScreen.tsx
    │   │   ├── components/
    │   │   │   ├── DashboardHeader.tsx
    │   │   │   ├── DashboardStatsGrid.tsx
    │   │   │   ├── DashboardQuickActions.tsx
    │   │   │   ├── DashboardRecentSales.tsx
    │   │   │   └── KpiCard.tsx
    │   │   ├── hooks/useDashboard.ts
    │   │   ├── services/dashboardService.ts
    │   │   └── store/dashboardSlice.ts
    │   │
    │   ├── pos/
    │   │   ├── screens/
    │   │   │   ├── POSScreen.tsx           # Main POS screen — cart, billing, modals
    │   │   │   └── MedicineListScreen.tsx  # Searchable medicine list for adding to cart
    │   │   ├── components/
    │   │   │   ├── POSHeader.tsx
    │   │   │   ├── POSSearchRow.tsx
    │   │   │   ├── POSCustomerSection.tsx
    │   │   │   ├── POSCustomerPickerModal.tsx
    │   │   │   ├── POSCartSection.tsx
    │   │   │   ├── POSSummaryCard.tsx
    │   │   │   ├── POSScanModal.tsx
    │   │   │   ├── POSPaymentModal.tsx
    │   │   │   ├── POSInvoiceModal.tsx
    │   │   │   ├── POSPastOrdersModal.tsx
    │   │   │   └── BillingSummaryCard.tsx
    │   │   ├── hooks/usePOS.ts
    │   │   ├── services/posService.ts      # saveCart, getOrAssignCart, placeOrder
    │   │   ├── store/posSlice.ts
    │   │   ├── types.ts                    # CartItem, Customer, Medicine, PaymentMethod, etc.
    │   │   ├── utils.ts                    # formatAmount and other helpers
    │   │   └── constants.ts
    │   │
    │   ├── inventory/
    │   │   ├── screens/
    │   │   │   ├── InventoryScreen.tsx
    │   │   │   └── InventoryDetailsScreen.tsx
    │   │   ├── components/
    │   │   │   ├── InventoryCard.tsx
    │   │   │   ├── InventorySummaryCard.tsx
    │   │   │   ├── MedicineDetailModal.tsx
    │   │   │   ├── AddStockModal.tsx
    │   │   │   ├── RemoveStockModal.tsx
    │   │   │   ├── QuickAddMedicineModal.tsx
    │   │   │   └── BarcodeScannerModal.tsx
    │   │   ├── hooks/useInventory.ts
    │   │   ├── services/inventoryService.ts
    │   │   ├── store/inventorySlice.ts
    │   │   └── types.ts
    │   │
    │   ├── orders/
    │   │   ├── screens/OrdersScreen.tsx
    │   │   ├── components/
    │   │   │   ├── OrderCard.tsx
    │   │   │   ├── OrderDetailModal.tsx
    │   │   │   ├── OrderSummaryModal.tsx
    │   │   │   ├── OrdersSummaryCard.tsx
    │   │   │   └── OrdersTabs.tsx
    │   │   ├── hooks/useOrders.ts
    │   │   ├── services/ordersService.ts
    │   │   ├── store/ordersSlice.ts
    │   │   └── types.ts
    │   │
    │   ├── reports/
    │   │   ├── screens/ReportsScreen.tsx
    │   │   ├── components/ReportsSummaryCard.tsx
    │   │   ├── hooks/useReports.ts
    │   │   ├── services/reportsService.ts
    │   │   └── store/reportsSlice.ts
    │   │
    │   ├── attendance/
    │   │   ├── screens/AttendanceScreen.tsx
    │   │   ├── components/AttendanceSummaryCard.tsx
    │   │   ├── hooks/useAttendance.ts
    │   │   ├── services/attendanceService.ts
    │   │   └── store/attendanceSlice.ts
    │   │
    │   └── settings/
    │       ├── screens/
    │       │   ├── SettingsScreen.tsx
    │       │   ├── SettingsDetailsScreen.tsx
    │       │   ├── CustomersScreen.tsx
    │       │   ├── CustomerDetailsScreen.tsx
    │       │   ├── OrderHistoryScreen.tsx
    │       │   ├── ProfileScreen.tsx
    │       │   └── AboutScreen.tsx
    │       ├── components/
    │       │   └── ThemeSelectorCard.tsx
    │       ├── hooks/useSettings.ts
    │       ├── services/
    │       │   ├── customerService.ts
    │       │   ├── profileService.ts
    │       │   └── settingsService.ts
    │       ├── store/settingsSlice.ts      # themeMode, systemScheme state
    │       └── types.ts
    │
    └── shared/
        ├── components/
        │   ├── AppButton.tsx
        │   ├── AppCard.tsx
        │   ├── AppInput.tsx
        │   ├── AppModal.tsx
        │   ├── ScreenLayout.tsx
        │   ├── SearchableDropdown.tsx
        │   └── index.ts
        ├── constants/
        │   ├── routes.ts               # TAB_ROUTES and STACK_ROUTES constants
        │   └── layout.ts               # SCREEN_BOTTOM_PADDING and other layout values
        ├── theme/
        │   ├── colors.ts               # Base color palette
        │   ├── index.ts                # AppTheme type, lightTheme, darkTheme, resolveTheme()
        │   └── useAppTheme.ts          # Hook returning the current resolved theme
        └── utils/
            ├── auth.ts                 # Auth utility helpers
            └── format.ts              # Generic formatting utilities
```

---

## State Management

The Redux store (`src/app/store.ts`) combines eight feature slices:

| Slice key | Feature |
|---|---|
| `auth` | Login state, session, hydration flag |
| `dashboard` | KPI data, recent sales |
| `pos` | Bill total |
| `orders` | Order list and filters |
| `inventory` | Medicine/stock list |
| `reports` | Report data |
| `attendance` | Attendance records |
| `settings` | Theme mode, system scheme |

---

## Theming

Three modes are supported: `light`, `dark`, `system`.

- `resolveTheme(mode, systemScheme)` in `src/shared/theme/index.ts` returns an `AppTheme` object.
- `useAppTheme()` hook gives components access to the current theme.
- The `RootNavigator` syncs the device color scheme into Redux on mount and forwards it to React Navigation's `NavigationContainer`.

---

## Scripts

```sh
npm start          # Start Metro bundler
npm run android    # Build and run on Android
npm run ios        # Build and run on iOS
npm run lint       # ESLint
npm test           # Jest
```

---

## Troubleshooting

- **Metro cache issues**: `npm start -- --reset-cache`
- **iOS build fails**: Run `bundle exec pod install` then clean build in Xcode
- **Android build fails**: Run `./gradlew clean` inside the `android/` directory
- **API unreachable**: The backend uses an ngrok tunnel — update the base URLs in the service files when the tunnel URL changes

---

## Learn More

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Frappe Framework Docs](https://frappeframework.com/docs)
