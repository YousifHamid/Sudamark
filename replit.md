# Arabaty - Car Marketplace Mobile App

## Overview

A multi-role car marketplace mobile application built with React Native and Expo for the Sudanese market. The app connects car buyers, sellers, and automotive service providers (mechanics, electricians, lawyers, and inspection centers) in a unified marketplace. The application features **email magic link authentication** with phone number collection (phone used for contact purposes, not verified), car listing and browsing capabilities, and a service provider directory. **Arabic is the default language** with English available as an option.

## Recent Changes (December 2025)

- Built complete MVP with 5-tab navigation (Home, Search, Services, Profile + FAB)
- Implemented email magic link authentication with phone collection and role selection
- Created car listing screens (Home, Search, CarDetail, PostCar)
- Added service providers directory with category filtering
- Implemented favorites and AsyncStorage persistence
- Generated app icon and updated splash screen
- Applied iOS 26 Liquid Glass-inspired design guidelines
- **Added Arabic as default language with RTL layout support**
- **Created LanguageContext with comprehensive translations for ALL screens**
- **Language switcher in Profile screen to toggle between Arabic and English**
- **3-screen onboarding flow with Arabaty logo and bilingual content**
- **All screens translated: Home, Search, Services, CarDetail, PostCar, Profile, Login, Onboarding**
- **Tab navigation labels in Arabic (الرئيسية, بحث, الخدمات, الملف)**
- **Sudanese cities for location filters (الخرطوم, أم درمان, بحري, بورتسودان, كسلا)**
- **Currency shown in Sudanese Pounds (SDG/جنيه)**
- **Updated app with new Arabaty logo (ARABATY2_1766665788809.png) in HeaderTitle, Onboarding, App Icon**
- **Replaced car classified image slider with clean search bar on HomeScreen**
- **Header logo enlarged 1.5x for better visibility**
- **Improved bottom tab bar with larger icons, better styling, and highlighted active state**
- **Added Arabic advertisement banners on HomeScreen with gradient cards**
- **FAB button now shows "بيع" (Sell) or "طلب" (Request) label based on user role**
- **Buyer Offers feature**: Modal in CarDetailScreen to submit price offers to sellers
- **Inspection Requests API**: Full CRUD endpoints for requesting car inspections
- **ServiceProviderDetailScreen**: Detailed view with WhatsApp, call, and map integration
- **ProfileScreen navigation**: My Listings and Favorites now navigate to filtered search views
- **Removed inspection_center role** from service provider categories (only mechanics, electricians, lawyers)
- **Payment System for Car Listings**: First 1000 listings are free, listings #1001+ require 10,000 SDG payment via Bankak QR code
- **3-Step Post Car Flow**: Form → QR Payment → Waiting for Approval (for paid listings)
- **Admin Payments Dashboard**: New "المدفوعات" tab with approve/reject buttons and auto-approval toggle
- **Unified Color Scheme**: 3 colors only - dark blue (#1E3A5F), warm orange (#E8A54B), and white - applied consistently in both light and dark modes

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **State Management**: React Context for auth, cars, and service providers; TanStack React Query for server state
- **UI Approach**: Custom themed components with dark/light mode support via `useTheme` hook
- **Animations**: React Native Reanimated for smooth UI interactions
- **Styling**: StyleSheet-based with centralized theme constants (Colors, Spacing, BorderRadius, Typography)

### Backend Architecture
- **Runtime**: Express.js on Node.js
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **API Pattern**: REST endpoints prefixed with `/api`
- **Storage**: In-memory storage class (`MemStorage`) as default, designed for easy swap to database-backed implementation

### Authentication Flow
- Phone number input → Role selection (first-time users) - No verification required for initial login
- **TESTING MODE**: No phone verification - anyone can log in with any phone number (NOT for production)
- Email verification required only when posting a car ad (via magic link)
- User roles: Buyer, Seller, Mechanic, Electrician, Lawyer, Inspection Center
- JWT-based session management with AsyncStorage persistence on client
- Phone number saved for contact purposes (WhatsApp/calls)

### Navigation Structure
- **Tab Navigation**: 5 tabs (Home, Search, Post/Sell, Services, Profile)
- **Center FAB**: Role-dependent action button (Post Car for sellers, Requests for buyers)
- **Stack Navigators**: Nested within tabs for detail screens (CarDetail, RequestInspection, PostCar)

### Data Layer
- **Client-side**: Context providers with sample data for cars and service providers
- **Persistence**: AsyncStorage for user data and favorites
- **Schema**: Drizzle schema in `shared/schema.ts` with Zod validation via drizzle-zod

### Build Configuration
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared`
- **Module Resolution**: Babel module-resolver for consistent imports
- **Development**: Dual process setup - Expo dev server + Express API server

## External Dependencies

### Database
- **PostgreSQL**: Primary database via Drizzle ORM
- **Connection**: `DATABASE_URL` environment variable required for database operations

### Key Libraries
- **expo-image**: Optimized image loading and caching
- **expo-image-picker**: Native image selection for car listings
- **react-native-keyboard-controller**: Enhanced keyboard handling
- **expo-haptics**: Tactile feedback for user interactions
- **@tanstack/react-query**: Server state management and caching

### API Integration Points
- Backend API served on port 5000
- CORS configured for Replit domains
- `EXPO_PUBLIC_DOMAIN` environment variable for API URL construction

### Planned Integrations
- WhatsApp OTP service (Twilio-ready abstraction)
- SMS fallback for OTP delivery

## Production Configuration

### Email Magic Link Authentication
- **Email Provider**: Brevo (formerly Sendinblue) SMTP
- **Configuration**: Secrets `BREVO_SMTP_LOGIN` and `BREVO_SMTP_PASSWORD` are set
- **Behavior**: 
  - If SMTP credentials are present, real emails are sent
  - If credentials are missing, falls back to demo mode (token shown in app)
  - Magic links expire after 30 minutes and are single-use
- **Email Template**: Bilingual (Arabic/English) with login button and token code

### Admin Dashboard
- Access at `/admin` route (e.g., https://your-domain.replit.app/admin)
- First-time setup: Create admin account via the dashboard
- Features: Manage users, cars, service providers, and view statistics

### Database
- PostgreSQL with Drizzle ORM
- Tables: users, cars, service_providers, favorites, slider_images, admins, otp_codes, magic_tokens
- Run `npm run db:push` to sync schema changes

### API Endpoints
- `/api/auth/*` - Authentication (send-magic-link, verify-magic-link, verify-token, register)
- `/api/cars/*` - Car listings CRUD
- `/api/service-providers/*` - Service providers
- `/api/favorites/*` - User favorites
- `/api/offers/*` - Buyer offers (create, list my-offers, received, update status)
- `/api/inspection-requests/*` - Inspection requests (create, received, respond)
- `/api/listings/status` - Check if payment is required (totalListings vs freeLimit)
- `/api/payments` - Submit payment for car listing
- `/api/admin/*` - Admin dashboard APIs (requires admin auth)
- `/api/admin/payments` - List all payments (GET), approve/reject payments (PUT)
- `/api/admin/settings/auto-approve` - Get/set auto-approval setting