# Sudamark App Documentation

## 1. App Brief
**Sudamark** is a comprehensive automotive marketplace application designed specifically for the Sudanese market. It connects car buyers, sellers, and service providers in a single platform. The app supports English and Arabic (RTL) to cater to the local audience.

### Core Value Proposition
- **Buy & Sell**: Users can list cars for sale or browse listings with advanced filtering.
- **Service Providers**: Connect with mechanics, parts dealers, and inspection services.
- **Safety**: Includes reporting mechanisms, verification badges, and secure offers.
- **Accessibility**: Dual-language support and simplified UI for ease of use.

## 2. Technology Stack

### Frontend (Mobile)
- **Framework**: React Native with Expo (SDK 54).
- **Language**: TypeScript (TSX).
- **Navigation**: React Navigation (Native Stack & Bottom Tabs).
- **Styling**: `StyleSheet` (Standard React Native) with custom Theme hooks (`useTheme`) and standardized tokens (`Spacing`, `BorderRadius`).
- **Animations**: `react-native-reanimated` (used for the header car animation).
- **State & Data Fetching**: `@tanstack/react-query` for server state management.
- **Assets**: Expo Image, Vector Icons (`@expo/vector-icons`).

### Backend (API)
- **Runtime**: Node.js.
- **Framework**: Express.js.
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **Authentication**: JWT & OTP-based (Phone auth).

### Infrastructure & Tools
- **Build**: EAS (Expo Application Services).
- **Hosting**: Railway (Backend & Database).
- **Package Manager**: NPM/Yarn.

## 3. Key Features

### User Features
1.  **Home Screen**:
    -   Dynamic slider for ads/featured content.
    -   Quick category access (Sedan, SUV, Truck, Motor, Raksha).
    -   Animated "driving car" header background.
    -   Sections for "Featured Cars" and "Recent Listings".
    -   Pull-to-refresh & Auto-refresh logic (every 10s).
2.  **Search & Exploration**:
    -   Advanced filtering by category, price, year, etc.
    -   Dedicated `SearchScreen`.
3.  **Car Listings**:
    -   `PostCarScreen`: Comprehensive form for adding car details, specs, and photos.
    -   `CarDetailScreen`: In-depth view of vehicle specs, price, and seller contact.
4.  **Services**:
    -   Directory of service providers (mechanics, insurance, etc.).
    -   `ServiceProviderDetailScreen` for individual provider info.
5.  **User Profile**:
    -   `ProfileScreen` & `EditProfileScreen`.
    -   Authentication (`LoginScreen`, `OnboardingScreen`).
    -   Favorites list.
6.  **Inspection & Offers**:
    -   `RequestInspectionScreen`: Schedule car inspections.
    -   Buyer offers management.
7.  **Localization**:
    -   Full RTL support across all screens.
    -   Arabic/English language toggle.

### Administrative Features
-   **Admin Dashboard** (Modelled in Schema): Management of users, listings, and service providers.
-   **Reports**: `ReportScreen` for users to flag inappropriate content.

## 4. Workflows

### Development Workflow
1.  **Run Locally**: `npx expo start -c` (starts Metro bundler).
    -   Use the "development" profile in `eas.json` for dev client builds.
2.  **Database Migration**: `npm run db:push` (Drizzle Kit).
3.  **Code Structure**:
    -   `client/`: All React Native code.
    -   `server/`: API logic.
    -   `shared/`: Shared Types/Schemas (Zod definitions).

### Deployment Workflow (EAS)
To build the application for Android, use the following commands:
-   **APK (Installable file)**: `eas build -p android --profile production-apk`
-   **AAB (Play Store Bundle)**: `eas build -p android --profile production`
    -   *Note: The profile `production` is configured to output an `app-bundle`.*

## 5. Recent Updates & Resolved Issues

### Feature Updates
-   **New Categories**: Added "Motor" and "Raksha" to the home screen and search filters.
-   **Header Animation**: Implemented a custom `AnimatedHeaderBackground` component on the Home screen.
    -   *Behavior*: A car image drives from right to left (RTL friendly) across the bottom of the header.
    -   *Tech*: Uses `react-native-reanimated` shared values and timing loops.

### Bug Fixes
-   **RTL Alignment**: Fixed miscellaneous layout issues where text/icons weren't flipping correctly for Arabic users.
-   **Navigation**: Updated `HomeStackNavigator` to support the transparent header required for the new background animation.

### Command & Build Issues
-   **Issue**: `eas build -p android --profile production-aab` failed.
-   **Resolution**: The profile `production-aab` does not exist in `eas.json`.
-   **Correct Usage**: Use `eas build -p android --profile production`. This profile is already configured with `"buildType": "app-bundle"`.

## 6. Task List (Status)

- [x] **Project Setup**: Basic Expo + Express setup.
- [x] **Database Schema**: Defined Users, Cars, Providers, etc.
- [x] **Authentication**: Phone/OTP flow implemented.
- [x] **Core UI**: Home, Search, Details, Profile screens.
- [x] **Localization**: Arabic/English support active.
- [x] **Car Posting**: Form and API endpoints operational.
- [x] **Header Animation**: "Driving car" visual effect added.
- [ ] **Push Notifications**: (Schema exists, implementation pending).
- [ ] **Payment Integration**: (Schema exists, detailed gateway integration pending).
- [ ] **Play Store Release**: Ready for AAB generation via `profile: production`.

## 7. Data Models (Schema Overview)
-   **Users**: Stores profile info, phone, role (buyer/seller).
-   **Cars**: Core listing data (make, model, year, price, images, JSON specs).
-   **ServiceProviders**: Business profiles for mechanics/services.
-   **Interactions**: BuyerOffers, InspectionRequests, Favorites, Reports.
-   **System**: Admins, OTPCodes, SliderImages, AppSettings.

---
*Last Updated: 2026-01-21*

## 8. Resolution Log (Commands & Changes)

This section details specific issues encountered during the session and the exact steps/commands used to resolve them.

### 1. Issue: Header Background Image
- **Request**: Add `car.png` behind the app bar text/images on the Home Screen.
- **Resolution**:
    -   Modified `client/navigation/HomeStackNavigator.tsx`.
    -   Added a custom `headerBackground` component to `Stack.Screen` options.
    -   Set image opacity to `0.1` for subtle effect.

### 2. Issue: Header Image Animation (Right)
- **Request**: Move the image to the bottom and animate it moving to the right.
- **Resolution**:
    -   Created `client/components/AnimatedHeaderBackground.tsx` using `react-native-reanimated`.
    -   Replaced the static image in `HomeStackNavigator.tsx` with this new component.
    -   Logic: `translateX` from `-Width` to `+Width`.

### 3. Issue: Header Image Animation (Left + Flip)
- **Request**: Animate to the left and ensure it acts like a driving car (facing forward).
- **Resolution**:
    -   Updated `AnimatedHeaderBackground.tsx`.
    -   **Code Change**:
        ```typescript
        // Animate from Right (SCREEN_WIDTH) to Left (-CAR_WIDTH)
        translateX.value = withRepeat(withTiming(-CAR_WIDTH, ...), -1, false);
        // Flip image to face left
        transform: [{ scaleX: -1 }, { translateX: ... }]
        ```

### 4. Issue: Animation Boundary
- **Request**: Ensure the car moves all the way to the end of the screen.
- **Resolution**:
    -   Adjusted start/end values in `AnimatedHeaderBackground.tsx` to `SCREEN_WIDTH + CAR_WIDTH` and `-CAR_WIDTH` to ensure full entry and exit from the viewport.

### 5. Issue: Production Build Failure
- **Error**: `eas build -p android --profile production-aab` returned `Exit Code 1` (Missing build profile).
- **Diagnosis**: Checked `eas.json` and found no profile named `production-aab`. The correct profile for App Bundles is named simply `production`.
- **Resolution**:
    -   **Correct Command**:
        ```bash
        eas build -p android --profile production
        ```
    -   This successfully initialized the build process for the AAB file.
