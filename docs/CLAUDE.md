# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StaffLink (formerly BlueShift) is a blue-collar worker scheduling platform connecting enterprises with skilled workers. The project consists of:
- React Native mobile app (Expo) for both companies and workers
- Node.js/Express backend API with PostgreSQL database
- Real-time features using Socket.IO
- SMS-based authentication system
- Multi-language support

## Commands

### Frontend (React Native/Expo)
```bash
# Start development server
npm start

# Platform-specific starts
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser

# Install dependencies
npm install
```

### Backend API
```bash
cd backend-api

# Development with auto-reload
npm run dev

# Production
npm start

# Run tests
npm test

# Database setup
createdb blue_collar_platform
psql -d blue_collar_platform -f ../database_schema_final.sql
```

## Architecture

### Frontend Structure
- **src/screens/**: Main app screens (Home, Projects, Workers, etc.)
- **src/components/**: Reusable UI components including multi-step wizards
- **src/contexts/**: React contexts for Auth, Theme, Language, Notifications
- **src/services/**: API client and authentication services
- **src/config/**: Firebase configuration
- **src/localization/**: Multi-language support

### Backend Structure
- **src/controllers/**: Business logic for each resource
- **src/routes/**: Express route definitions
- **src/middleware/**: Auth and error handling middleware
- **src/services/**: External services (SMS)
- **src/config/**: Database configuration
- **src/utils/**: Logging and utilities

### Key Features
1. **Two-sided marketplace**: Separate flows for companies (hiring) and workers (finding jobs)
2. **Project creation wizard**: 5-step process for companies to create job postings
3. **Skill matching**: 143 predefined skills across 5 categories
4. **Real-time notifications**: WebSocket-based updates for job invitations
5. **SMS authentication**: Phone number + verification code login

### Database Schema
- **companies**: Enterprise users who post jobs
- **workers**: Blue-collar workers with skills and availability
- **projects**: Job postings with requirements and schedules
- **invitations**: Job offers sent to workers
- **skills/worker_skills**: Skill taxonomy and worker proficiencies
- **notifications**: System notifications for both user types

### API Endpoints
All endpoints prefixed with `/api/`:
- **Auth**: `/auth/send-code`, `/auth/login`, `/auth/register`
- **Companies**: `/companies/profile`
- **Workers**: `/workers`, `/workers/profile`, `/workers/status`
- **Projects**: CRUD operations on `/projects`
- **Invitations**: `/invitations`, `/invitations/sent`, `/invitations/:id/respond`
- **Skills**: `/skills`, `/skills/category/:category`, `/skills/worker`
- **Notifications**: `/notifications`, `/notifications/:id/read`

### Security
- JWT authentication with token management
- Rate limiting (100 requests/15 min)
- Input validation using express-validator
- CORS and Helmet protection
- Environment-based configuration

### Development Notes
- Backend runs on port 3000 by default
- Frontend uses Expo development server
- PostgreSQL required for backend
- Firebase used for additional auth in frontend
- Real-time features via Socket.IO on same port as API

## Recent Updates (2025-08-06)

### Project Structure Reorganization
- Reorganized entire project into a cleaner monorepo structure:
  ```
  Blue_collar/
  ├── backend/           # Unified backend API (consolidated from 3 separate APIs)
  ├── apps/              
  │   ├── company/       # Company app (React Native/Expo)
  │   └── worker/        # Worker app (React Native/Expo) 
  ├── database/          # Database schema and migrations
  └── docs/              # Documentation
  ```
- Successfully migrated all code to new structure
- All three components (backend, company app, worker app) tested and working

### Worker App Rebuild
- Completely rebuilt worker app using latest Expo SDK (53.0.20)
- Fixed all dependency issues and icon imports
- Replaced `react-native-vector-icons` with `@expo/vector-icons`
- Worker app now fully functional with:
  - Login system (test account: 13800138000 / 123456)
  - Job invitations list with pending/accepted filters
  - Job detail view with accept/reject functionality
  - Profile and history screens
  - Bottom tab navigation

### Bug Fixes
- Fixed project details page salary display issue (支持 hourly/daily/total payment types)
- Fixed database connection to use Tencent Cloud PostgreSQL
- Updated all API endpoints to work with new structure

### Testing Completed
- ✅ Backend API starts successfully on port 3000
- ✅ Company app runs on port 8081
- ✅ Worker app runs on port 8082  
- ✅ Database connection working (Tencent Cloud)
- ✅ Core features tested and working

## Recent Updates (2025-08-05)

### Project Details Page Redesign
- Completely redesigned the project details screen with a modern tab-based interface
- Added 4 tabs: Overview (概览), Workers (工人), Communication (沟通), Details (详情)
- Implemented progress tracking for worker recruitment
- Added real-time status updates and quick actions

### Skills System Fix
- Fixed the skills saving issue where selected skills were not being saved to database
- Inserted all 52 required skills into the database across 5 categories:
  - Construction (17 skills)
  - Food & Beverage (8 skills)  
  - Manufacturing (16 skills)
  - Logistics (8 skills)
  - General Services (4 skills)
- Updated backend skill mapping to use direct database IDs instead of skill names
- Frontend skill IDs now correctly map to backend expectations

### Key Files Modified
- `/apps/company/src/screens/ProjectDetailScreen.js` - Complete redesign with tabs
- `/apps/company/src/components/createProject/WorkRequirementsStep.js` - Updated skill IDs
- `/backend/src/controllers/projectController.js` - Changed to direct ID mapping
- Created skill insertion scripts in `/backend/src/scripts/`

### Database Changes
- All skills now properly inserted in `skills` table with correct IDs
- Skill ID mapping: e.g., 'plumbingInstall' → 75, 'electrician' → 79, etc.
- Project types now display in Chinese (e.g., 'home_renovation' → '家庭装修')

## Recent Updates (2025-08-07)

### Worker Response System Implementation ✅
Successfully implemented a complete worker invitation and response system:

1. **Database Changes**
   - Created `invitations` table in Tencent Cloud PostgreSQL
   - Supports tracking invitation status (pending/accepted/rejected/expired/cancelled)
   - Includes wage offers, messages, and response tracking

2. **Backend API Endpoints**
   - `POST /api/invitations` - Create single invitation
   - `POST /api/invitations/batch` - Batch create invitations
   - `GET /api/invitations/company` - Get company's sent invitations
   - `GET /api/invitations/worker` - Get worker's received invitations
   - `PUT /api/invitations/:id/respond` - Worker respond to invitation
   - `PUT /api/invitations/:id/cancel` - Company cancel invitation
   - `GET /api/invitations/:id` - Get invitation details

3. **Frontend Integration**
   - **Worker App**: 
     - Connected to real invitation API
     - Workers can view pending/accepted invitations
     - Accept/reject functionality with response messages
     - Real-time status updates
   - **Company App**:
     - Auto-creates invitations when creating projects with selected workers
     - Project details page shows worker response status
     - Real-time tracking of pending/confirmed/rejected workers
     - Visual progress indicators for recruitment

4. **Key Files Added/Modified**
   - `/backend/src/controllers/invitationController.js` - Invitation business logic
   - `/backend/src/routes/invitations.js` - API routes
   - `/backend/src/middleware/authSimple.js` - Simplified auth for development
   - `/apps/worker/src/services/api.js` - Worker app API service
   - `/apps/company/src/services/api.js` - Added invitation APIs
   - `/database/create_invitations_table.sql` - Table schema

### Next Steps (TODO)
1. **Real-time Notifications** - Implement Socket.IO for instant updates
2. **Clean up old directories** - Remove MVP/, WorkerApp/, api/, blue-collar-api/
3. **Production Deployment** - Deploy to cloud servers
4. **Performance Optimization** - Add caching and optimize queries
5. **Testing Suite** - Add comprehensive unit and integration tests