# Ruko 🛡️

**Ruko** ("Stop!" before paying) is a real-time scam prevention, threat detection, and citizen reporting platform designed to protect citizens from UPI and digital payment frauds before transactions occur.

---

## 🌟 Features

- 📸 **Multi-Modal Threat Scanner**:
  - **Live QR Camera Scan**: Real-time QR code decoding via camera feed.
  - **QR Screenshot Upload**: Drag-and-drop or select saved QR screenshots from device storage.
  - **UPI ID Lookup**: Manual check for handle patterns (e.g. `scammer@paytm`).
  - **Phone Number Lookup**: Query fraud history by entering a 10-digit mobile number.
- ⚡ **Dynamic Risk Engine**:
  - **1–3 Reports**: 🟡 Low Risk
  - **4–7 Reports**: 🟠 Medium Risk
  - **8+ Reports**: 🔴 High Risk
- 🕸️ **Scammer Network Detection**:
  - Postgres triggers automatically extract phone numbers embedded in UPI IDs (e.g., `9876543210@paytm`).
  - Cross-references the database to detect and warn users if a scammer is operating multiple handles under the same phone number.
- 🌐 **OSINT & Public Web Signals Module**:
  - Pulls mentions from public sources (Reddit, RSS, Telegram).
  - Flags accounts with explicit **reasons** and original context links.
  - **Risk Cap Guardrail**: OSINT signals alone can *never* trigger a High Risk classification without human citizen reports.
  - **Decay & Purge**: Automated `pg_cron` jobs halve confidence weights after 180 days and purge unverified signals after 2 years.
- 📝 **Citizen Reporting & Auto-Approval**:
  - Authenticated users can file fraud reports with category tags (Fake QR, OTP Scam, Loan Fraud, etc.), detailed descriptions, and evidence screenshots.
  - Reports are stored in Supabase Storage (`evidence` bucket) and immediately update public risk scores.
- 👤 **User Profile Dashboard**:
  - Manage account details (Email, Profile ID).
  - Save custom **Username** and **Personal UPI ID**.
  - Track personal submission history and report statuses.
- 🚀 **Direct Payment Deep-Linking**:
  - Clicking "Proceed to Pay" triggers the OS-level `upi://pay?pa=...` intent, opening installed apps like GPay, PhonePe, or Paytm directly.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React Router DOM, Lucide Icons, Custom Glassmorphism CSS.
- **Backend / Database**: Supabase (PostgreSQL), Row Level Security (RLS), PL/pgSQL Triggers & Functions, Supabase Auth, Supabase Storage.
- **Scraper Connectors**: Supabase Edge Functions (Deno / TypeScript).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase project credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/upi-shield.git
   cd upi-shield/upi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `upi` folder with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

---

## 📱 Mobile App (Expo)

A full native mobile version of UPI Shield built with **React Native & Expo SDK 54** is available in the `upi-mobile` directory.

To run the mobile app:
```bash
cd ../upi-mobile
npm install
npx expo start --tunnel
```
Scan the generated QR code with **Expo Go** on your iOS or Android device.

---

## 🔒 Security & Compliance

- **No Public Raw Text**: Raw scraped text from web signals is kept internal and never rendered in the UI to prevent defamation risks.
- **Row Level Security**: All database tables (`reports`, `profiles`, `osint_signals`) are protected with strict Postgres RLS policies.
- **Data Retention**: Unverified web signals are automatically purged after 2 years.
