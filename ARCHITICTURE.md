# Badr Delivery Platform Architecture

## Table of Contents
- [Introduction](#introduction)
- [Overview](#overview)
- [Module Breakdown](#module-breakdown)
  - [1. Authentication Module](#1-authentication-module)
  - [2. Database Module](#2-database-module)
  - [3. Logger Module](#3-logger-module)
  - [4. Notifications Module](#4-notifications-module)
  - [5. Orders Module](#5-orders-module)
  - [6. OTP Module](#6-otp-module)
  - [7. Payments Module](#7-payments-module)
  - [8. Translation Module](#8-translation-module)
  - [9. Utils Module](#9-utils-module)
- [Testing & Error Tracking](#testing--error-tracking)
- [Future Enhancements](#future-enhancements)
- [Notes & Recommendations](#notes--recommendations)

## Introduction

**Badr Delivery Platform** (منصة بدر لأعمال الدليفري) is a delivery application inspired by real-world experience as a delivery driver. The platform is designed to evolve through MVP stages, emphasizing user-centric design, security, and scalability. This document serves as a living record of the current architecture and code modules as of today, Friday, May 16, 2025.

## Overview

The application consists of multiple modules, each responsible for a specific aspect of the platform:
- **Authentication & Security**
- **Order Management**
- **Payment Processing**
- **Real-Time Notifications**
- **OTP Handling**
- **Logging & Error Reporting**

Version control is managed via Git, and all significant changes are documented and committed regularly. Additional context and decisions are noted in this file to help guide future development.

## Module Breakdown

### 1. Authentication Module
- **Path:** `modules/authentication/authentication.js`
- **Purpose:** Manage user authentication, login workflows, multi-factor authentication, and account recovery.
- **Current State:** Basic authentication flows have been outlined; further details will be added as you implement additional features.

### 2. Database Module
- **Path:** `modules/database/`
- **Purpose:** Handle interactions with the database. This module will manage queries, schema definitions, and database connections.
- **Note:** Implementation details are pending. Consider using free-tier cloud solutions (Firebase, MongoDB Atlas, etc.) during the MVP stage.

### 3. Logger Module
- **Path:** `modules/logger/logger.js`
- **Purpose:** Provides centralized logging using Winston with support for both console and remote logging (e.g., Loggly).  
- **Features:**
  - Configurable log levels.
  - Future integration with Sentry for error reporting.
- **Usage:** Wrap critical operations with logging calls to monitor system behavior.

### 4. Notifications Module
- **Path:** `modules/notifications/notifications.js`
- **Purpose:** Manage sending and handling notifications (push notifications, emails, etc.) for real-time updates to users.

### 5. Orders Module
- **Path:** `modules/orders/orders.js`
- **Purpose:** Process and manage orders, tracking their state throughout the delivery process.

### 6. OTP Module
This module is divided into three parts:
- **OTP Generation**
  - **File:** `modules/otp/otp_generator.js`
  - **Purpose:** Generate one-time passwords (OTPs) with options for default (6-digit) or custom lengths.
- **OTP Storage**
  - **File:** `modules/otp/otp_storage.js`
  - **Purpose:** In-memory storage of OTPs along with expiration timestamps, with functions to save and delete records.
- **OTP Verification**
  - **File:** `modules/otp/otp_verifier.js`
  - **Purpose:** Validate OTPs against stored records, checking correctness and expiration status.
- **Testing:** Jest tests (`tests/otp_generator.test.js`, `tests/otp_storage.test.js`, and `tests/otp_verifier.test.js`) verify these functionalities.

### 7. Payments Module
- **Path:** `modules/payments/payments.js`
- **Purpose:** Handle payment transactions, payment gateway integrations, and wallet functionalities.

### 8. Translation Module
- **Path:** `modules/translation/translation.js`
- **Purpose:** Manage language support (Arabic, English) and localization of user-facing content.

### 9. Utils Module
- **Path:** `modules/utils/utils.js` (with an additional backup file `utils.js.bak`)
- **Purpose:** A helper module containing shared functions, code utilities, and common operations used across the application.

## Testing & Error Tracking

- **Testing Framework:**  
  The project uses Jest for unit testing. All test files are located in the `tests/` directory.
  
- **Error Reporting:**  
  - Planned integration with **Sentry** to capture exceptions and crashes.
  - Current remote logging is implemented with **Winston** (optionally tied to Loggly).

## Future Enhancements

- **Sentry Integration:**  
  Create and connect a Sentry account for enhanced error tracking.
- **Persistent OTP Storage:**  
  Transition from in-memory storage to a persistent database once the MVP scales.
- **Slack Integration & AI Custom Agent:**  
  Consider building a custom Slack bot and long-term memory solution using frameworks like LangChain for persistent context.
- **UI Enhancements:**  
  Iteratively improve the front-end views to enhance user experience.

## Notes & Recommendations

- **Living Documentation:**  
  Continually update this file with every significant code change, new modules, or design decisions.
- **Version Control:**  
  Leverage Git commit history with detailed messages to track evolution.
- **External Memory & Summaries:**  
  At the start of each development session, consider providing a summary of this document to any supporting AI tools you work with, ensuring continuity across sessions.

---

*If you have updated JavaScript files that expand on these modules, please feel welcome to share them. I can then help incorporate the latest details into this architecture document!*


Due to unfiar work conditions in delivery
 applications and based on a former 
experience in software industry as 
QA Engineer and iOS developer 
the decision was made to build 
a platform to achive justice between 
couriers and customers and delivery 
system, promoting  professional 
performance and clarity while 
preserving courier freedom to achive 
a better work condition and have more 
life balance
