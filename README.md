# SchoolPay - Fees Management System

A comprehensive school fees management system built with Next.js, React, and Tailwind CSS. The system provides a complete dashboard for managing students, teachers, parents, fees, payments, attendance, and more.

## Features

### Core Modules
- **Dashboard** - Overview with statistics, charts, and real-time metrics
- **Students Management** - Add, edit, and manage student records
- **Teachers Management** - Teacher profiles and class assignments
- **Parents/Guardians** - Contact management for guardians
- **Classes** - Class organization and structure
- **Fees Management** - Fee structure configuration and tracking
- **Payments** - Payment tracking and transaction history
- **Reports** - Generate financial and attendance reports
- **Attendance** - Track student and staff attendance

### Key Features
- Professional dashboard with multiple charts and statistics
- Responsive design that works on desktop and mobile
- Real-time data visualization with Recharts
- User-friendly data tables with sorting and actions
- Settings and configuration management
- Profile management
- Calendar widget for event tracking
- Event and announcement management

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Utilities**: TypeScript, clsx

## Project Structure

\`\`\`
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard home
│   ├── globals.css             # Global styles
│   ├── students/               # Student management
│   ├── teachers/               # Teacher management
│   ├── parents/                # Parent management
│   ├── classes/                # Class management
│   ├── subjects/               # Subject management
│   ├── lessons/                # Lesson management
│   ├── exams/                  # Exam management
│   ├── results/                # Results management
│   ├── attendance/             # Attendance tracking
│   ├── events/                 # Events management
│   ├── messages/               # Messaging system
│   ├── fees/                   # Fee management
│   ├── payments/               # Payment tracking
│   ├── reports/                # Reports generation
│   ├── profile/                # User profile
│   └── settings/               # System settings
├── components/
│   ├── layout/                 # Layout components
│   │   ├── dashboard-layout.tsx
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── dashboard/              # Dashboard widgets
│   │   ├── stat-card.tsx
│   │   ├── students-chart.tsx
│   │   ├── attendance-chart.tsx
│   │   ├── finance-chart.tsx
│   │   ├── calendar-widget.tsx
│   │   ├── events-widget.tsx
│   │   └── announcements-widget.tsx
│   ├── students/               # Student components
│   ├── teachers/               # Teacher components
│   ├── parents/                # Parent components
│   ├── classes/                # Class components
│   ├── fees/                   # Fee components
│   ├── payments/               # Payment components
│   └── ui/                     # shadcn/ui components
├── lib/
│   └── utils.ts                # Utility functions
└── hooks/
    └── use-mobile.tsx          # Mobile detection hook

\`\`\`

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Design System

### Color Palette
- **Primary**: Purple (#8B5CF6)
- **Secondary**: Yellow (#FBBF24)
- **Neutral**: White, Gray, Black
- **Accent**: Light Blue, Red for alerts

### Typography
- **Font**: Inter (sans-serif)
- **Headings**: Bold weights
- **Body**: Regular weight with 1.4-1.6 line height

### Components
All UI components are built using shadcn/ui with custom styling via Tailwind CSS v4.

## Pages Overview

### Administrative Pages
- **Home/Dashboard** - Overview of all school metrics
- **Settings** - System configuration (fees, notifications, integrations)
- **Profile** - User account and security settings
- **Reports** - Generate and download reports

### Academic Management
- **Students** - Student database and fee status
- **Teachers** - Teacher profiles and assignments
- **Classes** - Class organization
- **Subjects** - Subject catalog
- **Exams** - Examination scheduling
- **Results** - Student results and grades

### Financial
- **Fees** - Configure fee structures and discounts
- **Payments** - Track all fee payments
- **Reports** - Financial reports and analytics

### Communication
- **Attendance** - Track attendance records
- **Events** - School events and announcements
- **Messages** - Internal communication system

## Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px (sidebar hidden, compact header)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (full layout)

## Sample Data

The application includes sample data for:
- 6 Students with fee status
- 5 Teachers with subject assignments
- 4 Parents/Guardians
- 6 Classes
- 6 Fee types
- Multiple payment records

## Customization

### To modify colors and theme:
Edit `app/globals.css` to update CSS custom properties in the `:root` selector.

### To add new pages:
1. Create a new directory in `app/`
2. Add `page.tsx` with your content
3. Update sidebar navigation in `components/layout/sidebar.tsx`

### To modify the dashboard:
Edit `app/page.tsx` to customize stats cards, charts, and widgets.

## License

This project is part of SchoolPay School Fees Management System.

## Support

For issues or questions, please refer to the documentation or contact support.
