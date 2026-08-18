# 🏥 Hospital Management System

A modern and responsive **Hospital Management System** built with **Next.js, React, TypeScript, and Tailwind CSS**.

This project is designed to provide a simple and user-friendly interface for managing hospital-related activities such as patients, doctors, profiles, dashboards, and other healthcare management features.

## 🚀 Project Overview

The Hospital Management System provides different sections and interfaces for hospital users.

The project currently includes:

- 👨‍⚕️ Doctor Dashboard
- 🧑‍⚕️ Patient Management
- 👤 User Profiles
- 📊 Dashboard Interface
- 🔐 Login & Sign Up UI
- 🔔 Notifications Interface
- 🏥 Hospital Management Pages
- 📱 Responsive Design
- 🎨 Modern UI Components

> **Note:** Firebase has been removed from the current version. The project is currently focused on the frontend/UI and can run without Firebase configuration.

## 🛠️ Technologies Used

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Lucide React
- date-fns
- Next.js App Router

## 📁 Project Structure

```text
Hospital/
│
├── public/
│   └── Images and static assets
│
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── sign-up/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── auth-components.tsx
│   │   └── notifications-menu.tsx
│   │
│   ├── context/
│   │   └── user-profile-context.tsx
│   │
│   └── lib/
│       └── utility files
│
├── package.json
├── next.config.js
├── tailwind.config.ts
└── README.md
