# Arabaty - Car Marketplace Mobile App

## Overview

A multi-role car marketplace mobile application built with React Native and Expo for the Sudanese market. The app connects car buyers, sellers, and automotive service providers (mechanics, electricians, lawyers, and inspection centers) in a unified marketplace. The application features mobile-first authentication via phone number with OTP verification (demo code: 123456), car listing and browsing capabilities, and a service provider directory. **Arabic is the default language** with English available as an option.

## Recent Changes (December 2025)

- Built complete MVP with 5-tab navigation (Home, Search, Services, Profile + FAB)
- Implemented phone + OTP authentication flow with role selection
- Created car listing screens (Home, Search, CarDetail, PostCar)
- Added service providers directory with category filtering
- Implemented favorites and AsyncStorage persistence
- Generated app icon and updated splash screen
- Applied iOS 26 Liquid Glass-inspired design guidelines
- **Added Arabic as default language with RTL layout support**
- **Created LanguageContext with full translations for onboarding, login, and profile screens**
- **Language switcher in Profile screen to toggle between Arabic and English**
- **3-screen onboarding flow with Arabaty logo and bilingual content**

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
- Phone number input → WhatsApp OTP verification → Role selection (first-time users)
- User roles: Buyer, Seller, Mechanic, Electrician, Lawyer, Inspection Center
- JWT-based session management with AsyncStorage persistence on client
- OTP service abstracted for Twilio integration with SMS fallback

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