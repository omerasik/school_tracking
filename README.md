# School Tracking

A secure mobile attendance tracking system for schools, built with React Native, Expo and Supabase.

Developed and maintained by Ömer Aşık.

## Project Overview

School Tracking is a mobile-first attendance management system designed for schools and higher education environments. It uses QR-based check-ins, role-based access, session control, geolocation validation, Supabase backend services and security-focused attendance flows.

The project is being developed as an individual school attendance SaaS and mobile app project by Ömer Aşık. It started from a prototype attendance scanner and is being reshaped into a tenant-first architecture that can support schools, courses, sessions, roles and auditable attendance records.

## Why This Project Exists

Manual attendance is slow, error-prone and easy to manipulate. School Tracking aims to make attendance faster, more reliable and more auditable by combining mobile check-ins with server-side validation, role-based access control and immutable finalized records.

## Core Features

- Student and teacher roles
- QR-based attendance check-in
- Teacher scan flow
- Attendance sessions
- Supabase Auth
- Role-based access control
- Tenant-first SaaS database direction
- Supabase Edge Functions
- Dynamic QR token logic
- Token single-use protection
- Optional geolocation validation
- Attendance audit logging
- Security test suite
- Mobile-first UI with Expo Router

## Current Status

School Tracking is in active development and is not yet production-ready.

A security hardening phase has been added to validate critical attendance and access-control behavior, including:

- teacher role guard
- teacher-course ownership guard
- atomic QR token consumption
- RLS hardening
- finalized attendance record lock
- security validation tests

## Architecture

The app is moving from a prototype attendance scanner toward a tenant-first SaaS architecture.

The mobile app is built with React Native and Expo Router. Supabase provides authentication, database storage, Row Level Security policies and Edge Functions. The backend model is being shaped around tenants, schools, campuses, courses, attendance sessions, attendance records, QR tokens, user roles and audit logs.

Current development includes both legacy prototype compatibility and newer SaaS-oriented tables. The security test suite is written to make that transition explicit.

## Roles & Access Control

Planned and current roles include:

- `student`
- `teacher`
- `admin`
- `school_manager`
- `super_admin`

Access control is enforced through a combination of Supabase Auth, role records, Row Level Security policies and authenticated Edge Functions.

## Attendance Flow

The intended MVP flow:

1. Teacher signs in.
2. Teacher sees today's lessons.
3. Teacher starts an attendance session.
4. Students show a QR code or participate in session-based check-in.
5. Backend validates token, role, session, duplicate usage and optional location.
6. Attendance record is created.
7. Session can be finalized.
8. Finalized records are protected from direct mutation.

## Security Model

Security work focuses on server-side enforcement rather than trusting the mobile client.

- Authenticated Edge Function access
- Teacher role guard
- Teacher-course ownership guard
- Token hashing
- Single-use token consumption
- Supabase Row Level Security policies
- Audit logging for critical events
- Finalized attendance record mutation lock
- Security tests for API, race-condition and RLS behavior

## Tech Stack

- React Native
- Expo
- Expo Router
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Edge Functions
- `expo-camera`
- `expo-location`
- `react-native-qrcode-svg`

## Project Structure

```text
src/
  app/                         Expo Router routes
    (auth)/                    Login and registration screens
    (app)/                     Authenticated app screens
  components/                  Design and functional UI components
  core/
    domain/                    Domain-level access and RBAC helpers
    modules/                   Feature modules for auth, courses, QR and attendance
    network/supabase/          Supabase client and generated database types
  style/                       Theme and screen styles

supabase/
  functions/                   Supabase Edge Functions
  migrations/                  SaaS schema and security hardening migrations

tests/security/                Security seed, API, race-condition and RLS tests
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the Expo app:

```bash
npm run start
```

Useful Expo commands:

```bash
npm run android
npm run ios
npm run web
```

## Environment Variables

Do not commit real environment values.

Example placeholders:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_ID=
```

For local security testing, see:

```text
tests/security/security-env.example
```

## Supabase Setup

Start local Supabase:

```bash
npx supabase start
```

Reset the local database and apply migrations:

```bash
npx supabase db reset
```

Serve Edge Functions locally:

```bash
npx supabase functions serve --env-file .env
```

## Edge Functions

Important Edge Functions include:

- `prototype-teacher-scan`
- `attendance-checkin`
- `session-qr`
- `session-start`

The security-sensitive functions validate authenticated requests, enforce role and ownership checks, protect QR tokens from reuse and write audit events for critical flows.

## Security Test Suite

Security tests live in:

```text
tests/security/
```

Recommended local flow:

```bash
npx supabase start
npx supabase db reset
npx supabase functions serve --env-file .env
```

Seed security fixtures:

```bash
node tests/security/seed-security-fixtures.mjs
```

Run Edge Function and API security checks:

```bash
node tests/security/edge-function-security-tests.mjs
```

Run the QR token race-condition test:

```bash
node tests/security/race-token-test.mjs
```

Run RLS and role-management checks:

```bash
node tests/security/rls-security-tests.mjs
```

The security suite is designed for local or staging Supabase projects only. It must not be run against production data.

## Roadmap

- Complete the transition from prototype scanner flows to tenant-first attendance sessions.
- Stabilize the role and permission model.
- Expand teacher and admin workflows.
- Improve session lifecycle management.
- Add stronger production deployment checks.
- Continue improving security test coverage.

## Author

Developed and maintained by Ömer Aşık.

GitHub: https://github.com/omerasik

## License

No open-source license has been selected yet. All rights are reserved unless a license is added.
