# Badr Delivery Platform Architecture

## Table of Contents

- [Introduction](#introduction)
  - [Background & Motivation](#background--motivation)
- [Overview](#overview)
- [Module Breakdown](#module-breakdown)
  - [1. Authentication Module](#1-authentication-module)
  - [2. Constants Module](#2-constants-module)
  - [3. Courier Module](#3-courier-module)
  - [4. Customer Module](#4-customer-module)
  - [5. Database Module](#5-database-module)
  - [6. Firebase Module](#6-firebase-module)
  - [7. Logger Module](#7-logger-module)
  - [8. Notifications Module](#8-notifications-module)
  - [9. Orders Module](#9-orders-module)
  - [10. OTP Module](#10-otp-module)
  - [11. Payments Module](#11-payments-module)
  - [12. Translation Module](#12-translation-module)
  - [13. Utils Module](#13-utils-module)
- [Hosting & Deployment](#hosting--deployment)
- [Current Development Environment](#current-development-environment)
  - [PWA Setup for VS Code Server](#pwa-setup-for-vs-code-server)
- [Development Challenges & Design Decisions](#development-challenges--design-decisions)
- [Testing & Error Tracking](#testing--error-tracking)
- [Future Enhancements](#future-enhancements)
- [Notes & Recommendations](#notes--recommendations)

---

## Introduction

**Badr Delivery Platform** (منصة بدر لأعمال الدليفري) is a delivery application inspired by real-world experience as a delivery driver. The platform is designed to evolve through MVP stages, emphasizing **user-centric design**, **security**, and **scalability**. This document serves as a **living record** of the current architecture and code modules as of today.

### Background & Motivation

Due to unfair work conditions present in many delivery applications—and drawing on previous experience as a **QA Engineer and iOS developer**—the decision was made to build this platform. The goal is to **ensure justice** among **couriers, customers, and the delivery system** by promoting **professional performance and operational clarity**, while preserving courier **freedom to achieve better work conditions** and maintain a **healthier work-life balance**.

---

## Overview

The application consists of multiple modules, each handling a specific function of the platform:

- **Authentication & Security**
- **Order Management**
- **Payment Processing**
- **Real-Time Notifications**
- **OTP Handling**
- **Logging & Error Reporting**

Version control is **managed via Git**, with detailed commit messages documenting all major changes.

---

## Module Breakdown

### 1. Authentication Module
- **Path:** `authentication/authentication.js`
- **Purpose:** Manages user authentication, multi-factor authentication, and account recovery.

### 2. Constants Module
- **Path:** `constants/constants.js`
- **Purpose:** Stores global constants such as error codes and default values.

### 3. Courier Module
- **Path:** `courier/`
- **Purpose:** Planned functionality for handling courier accounts, earnings tracking, and task assignment.

### 4. Customer Module
- **Path:** `customer/customer.js`
- **Purpose:** Manages customer details, including order history and interactions.

### 5. Database Module
- **Path:** `database/`
- **Purpose:** Handles interactions with the database, including queries and schema management.

### 6. Firebase Module
- **Path:** `firebase/`
- **Purpose:** Centralized Firebase functionality, split into submodules:
  - `firebase_config.js` – Initializes Firebase and handles environment settings.
  - `firebase_auth.js` – Manages Firebase authentication.
  - `firebase_db.js` – Manages Firestore queries and real-time interactions.
  - `firebase_storage.js` – Handles file uploads and retrieval.
  - `firebase_functions.js` – Wrapper for Firebase Cloud Functions (if used).

### 7. Logger Module
- **Path:** `logger/logger.js`
- **Purpose:** Provides centralized logging using **Winston**, with planned **Sentry integration**.

### 8. Notifications Module
- **Path:** `notifications/notifications.js`
- **Purpose:** Handles **push notifications, email alerts, and real-time updates**.

### 9. Orders Module
- **Path:** `orders/orders.js`
- **Purpose:** Manages order processing and tracking.

### 10. OTP Module
- **Path:** `otp/`
- **Purpose:** Handles OTP generation, storage, and verification.
  - `otp_generator.js`
  - `otp_storage.js`
  - `otp_verifier.js`

### 11. Payments Module
- **Path:** `payments/payments.js`
- **Purpose:** Handles **payment transactions**, **wallet functionalities**, and **gateway integrations**.

### 12. Translation Module
- **Path:** `translation/translation.js`
- **Purpose:** Provides **multi-language support** (Arabic and English).

### 13. Utils Module
- **Path:** `utils/`
- **Purpose:** Contains helper functions, code utilities, and common operations.
  - `utils.js`
  - `utils.js.bak`

---

## Hosting & Deployment

Originally intended to be **hosted on Firebase**, but Firebase Cloud Functions required billing activation via a **valid debit/credit card**, which was not feasible. Alternative **serverless deployment solutions** are being considered.

---

## Current Development Environment

**Primary Setup:**
- **Device:** Oppo A18 mobile
- **OS:** Termux Ubuntu distribution
- **Development Tools:**
  - **VS Code Server** (Firefox for stable input handling)
  - **Bluetooth Keyboard & Mouse app (Nokia C10 as touchpad)**
  - **4G Internet Connection**

### PWA Setup for VS Code Server

- **Chrome PWA Test:** **FAILED** – Chrome reloads frequently and retains the **mouse click bug**.
- **Firefox "Add to Home Screen" Test:** **FAILED** – It behaves like a shortcut, opening a tab that dies in the background.
- **Next Steps:** Exploring potential workarounds or moving to a desktop development setup.

---

## Development Challenges & Design Decisions

### Postponement of Views & Controllers
UI development was **postponed** until the core MVP logic is finalized. This decision was made to **reduce distractions** and ensure strong foundation code before tackling UI complexities.

### Environmental Challenges
- **Unfair work conditions** make it hard to focus on development.
- **High commission fees (~50%)** from delivery apps limit income and impact courier well-being.
- **Heat-related bike failures** slow progress in summer months.
- **Hardware limitations** (mobile screen size, lack of peripherals) disrupt productivity.

---

## Testing & Error Tracking

**Testing:**  
- **Jest Framework** for unit testing.
- Test files stored in `tests/`.

**Error Reporting:**  
- Winston logging system.
- Planned integration with **Sentry** for enhanced monitoring.

---

## Future Enhancements

- **Persistent OTP storage** – Transitioning from in-memory storage to **Firestore**.
- **Slack bot integration** – AI-assisted task tracking.
- **UI and Controller Development** – Once MVP logic stabilizes, UI design will begin.

---

## Notes & Recommendations

- **Regular documentation updates** – Track major decisions in this file.
- **Peripheral solutions** – If possible, acquiring an **OTG hub with power** for better mobile functionality.
- **Budget Optimizations** – Prioritizing **فول بالبيض** as a cost-effective meal to sustain energy.