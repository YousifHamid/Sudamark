# Car Marketplace Mobile App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - Multi-role marketplace with backend sync
- **Primary Method**: Mobile number + WhatsApp OTP (with SMS fallback)
- **No SSO** - Use mobile-first auth as specified
- **Login Flow**:
  - Welcome screen with language selection (Arabic default, English optional)
  - Phone number input with country code picker
  - OTP verification screen (6-digit code)
  - Role selection screen (first-time users): Buyer, Seller, Service Provider (Mechanic, Auto Electrician, Lawyer, Inspection Center)
- **Account Screen**:
  - Profile avatar (user-uploaded or default)
  - Display name, phone number (read-only), role badge
  - Settings: Language toggle, notifications, privacy
  - Log out with confirmation
  - Delete account (nested: Settings > Account Management > Delete Account with double confirmation)

### Navigation
**Tab Navigation** (5 tabs with center action)
- **Home** (Explore/Browse cars)
- **Search** (Advanced filters)
- **Sell/Post** (center FAB - role-dependent: Buyers see "Requests", Sellers see "Post Car", Service Providers see "My Services")
- **Services** (Service providers directory)
- **Profile** (User account & settings)

### Screen Specifications

#### 1. Home Screen
- **Purpose**: Browse featured cars, trending listings, homepage slider
- **Layout**:
  - Transparent header with app logo (left/right based on language), notification bell (right/left)
  - Full-width image slider (auto-rotating ads, 3-5 slides)
  - Scrollable content: Featured cars grid (2 columns), categories chips, recent listings
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**: Auto-rotating carousel, car cards with image/price/location, category chips, section headers

#### 2. Search Screen
- **Purpose**: Advanced filtering and car discovery
- **Layout**:
  - Default navigation header with "Search" title
  - Search bar below header (sticky)
  - Scrollable filters: Price range slider, city dropdown, make/model, year, mileage, condition
  - Results list (infinite scroll)
  - Floating "Apply Filters" button (bottom-right)
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**: Search input, multi-select chips, range sliders, dropdown selects, car result cards

#### 3. Car Listing Detail Screen (Modal)
- **Purpose**: View full car details, request inspection, contact seller
- **Layout**:
  - Custom header: Close button (X), share icon, favorite heart
  - Scrollable image gallery (swipeable, indicator dots)
  - Car details: Title, price (large, prominent), specs table, description, location with map preview
  - Action buttons: "Contact Seller" (primary), "Request Inspection" (secondary), "Report Listing"
  - Reviews section with ratings
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: Image carousel, spec grid, map widget, action buttons, review cards

#### 4. Post Car Screen (Sellers)
- **Purpose**: Create new car listing
- **Layout**:
  - Default header with "New Listing" title, Cancel (left), Post (right, disabled until valid)
  - Scrollable form: Image upload (multiple), make/model/year dropdowns, price input, mileage, condition, description textarea, location picker
  - Submit button in header (right)
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: Image picker (multi-upload), form inputs, dropdown selects, number inputs, text areas

#### 5. Service Provider Directory Screen
- **Purpose**: Browse mechanics, electricians, lawyers, inspection centers
- **Layout**:
  - Default header with "Services" title
  - Tabs below header: All, Mechanics, Electricians, Lawyers, Inspection Centers
  - List of provider cards with avatar, name, rating, location, "Contact" button
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**: Horizontal tab selector, provider cards, rating stars, location labels

#### 6. Inspection Request Screen (Modal)
- **Purpose**: Request car inspection from certified centers
- **Layout**:
  - Custom header: "Request Inspection", Close (X)
  - Form: Select car (dropdown), select inspection center, preferred date/time picker, notes
  - "Submit Request" button below form
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: Dropdown selects, date/time pickers, text input

#### 7. Inspection Report Screen (Modal)
- **Purpose**: View inspection results
- **Layout**:
  - Custom header: "Inspection Report", Close (X)
  - Status badge (Passed/Needs Repair/Rejected)
  - Scrollable report: Inspector details, inspection date, checklist items, photos, notes, recommendations
  - "Download PDF" button (floating, bottom)
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: Status badge, checklist items, image grid, downloadable PDF link

#### 8. Profile Screen
- **Purpose**: Manage account, view user activity, settings
- **Layout**:
  - Transparent header with "Profile" title, settings icon (right/left)
  - Profile section: Avatar (editable), name, phone, role badge
  - Scrollable sections: My Listings (sellers), My Requests (buyers), Favorites, Reviews Given, Settings
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**: Avatar picker, list sections, navigation arrows

## Design System

### RTL Support (Critical)
- **Default**: Arabic (RTL)
- **Optional**: English (LTR)
- All navigation, text alignment, icons flip for RTL
- Number formatting respects locale (Arabic-Indic numerals optional)

### Color Palette
- **Primary**: Deep Blue (#1E3A8A) - trust, automotive industry
- **Secondary**: Warm Orange (#FFA43A) - urgency, premium, friendly warmth
- **Success**: Green (#10B981) - approved, passed inspections
- **Warning**: Warm Orange (#FFA43A) - needs repair
- **Error**: Red (#EF4444) - rejected
- **Background**: Clean Off-White (#F5F7FA) - clean, light, inviting
- **Surface**: White (#FFFFFF)
- **Text Primary**: Charcoal (#1F2937)
- **Text Secondary**: Gray (#6B7280)

### Typography
- **Arabic Font**: Tajawal or Cairo (clean, modern)
- **English Font**: Inter or SF Pro
- **Headings**: Bold, 20-28pt
- **Body**: Regular, 14-16pt
- **Captions**: Regular, 12pt

### Components
- **Car Cards**: Rounded corners (12px), shadow (0px 2px 8px rgba(0,0,0,0.1)), image top, price prominent, location with pin icon
- **Buttons**: Rounded (8px), Primary (filled primary color), Secondary (outlined), Destructive (red)
- **Form Inputs**: Rounded (8px), border (gray), focus state (primary border), label above
- **Floating Action Button**: Circle (56dp), primary color, drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)
- **Tab Bar**: Background white, active tab primary color, inactive gray
- **Image Slider**: Full-width, rounded corners (optional), auto-play (3s interval), indicator dots (bottom)

### Critical Assets
1. **Car placeholder images** (5 different angles) - used when user hasn't uploaded photos
2. **Service provider category icons** - mechanic wrench, electrician bolt, lawyer gavel, inspection clipboard
3. **Empty state illustrations** - no listings, no favorites, no results
4. **App logo** - automotive-themed (steering wheel or car silhouette)

### Accessibility
- Minimum touch target: 44x44dp
- Color contrast ratio 4.5:1 for text
- Form inputs have clear labels
- Error messages clear and actionable
- Support screen readers (Arabic TalkBack/VoiceOver)