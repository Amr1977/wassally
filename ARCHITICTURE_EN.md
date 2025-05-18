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
- [Fair Pricing Model](#fair-pricing-model)
- [Notes & Recommendations](#notes--recommendations)

---

## Introduction

**Badr Delivery Platform** is a delivery application inspired by real-world experience as a delivery driver. The platform is designed to evolve via MVP stages with a focus on user-centric design, security, and scalability. This document serves as a living record of the current architecture, modules, and design decisions.

### Background & Motivation

Drawing on previous experience as a QA Engineer and iOS developer, and recognizing the unfair work conditions prevalent in traditional delivery platforms, this platform is built to protect driver rights and promote transparency. The goal is to create a fairer model that enables sustainable earnings and operational efficiency.

---

## Overview

The application comprises multiple modules covering authentication, order management, payment processing, notifications, OTP handling, logging, and more. Detailed version control and documentation ensure that every change is traceable.

---

## Module Breakdown

### 1. Authentication Module
- **Location:** `authentication/authentication.js`
- **Purpose:** Handles user sign-in, multi-factor authentication, and account recovery.

### 2. Constants Module
- **Location:** `constants/constants.js`
- **Purpose:** Centralizes global constants (error codes, default settings).

### 3. Courier Module
- **Location:** `courier/`
- **Purpose:** Will manage courier-specific logic such as account details, earnings, and task assignment.

### 4. Customer Module
- **Location:** `customer/customer.js`
- **Purpose:** Manages customer records, order history, and interactions.

### 5. Database Module
- **Location:** `database/`
- **Purpose:** Handles database interactions, queries, and schema management.

### 6. Firebase Module
- **Location:** `firebase/`
- **Files:**
  - `firebase_config.js` – Initializes Firebase and manages configurations.
  - `firebase_auth.js` – Wraps Firebase authentication functionality.
  - `firebase_db.js` – Manages Firestore/Realtime Database interactions.
  - `firebase_storage.js` – Handles file uploads and retrieval.
  - `firebase_functions.js` – Provides integration for Firebase Cloud Functions (if used).

### 7. Logger Module
- **Location:** `logger/logger.js`
- **Purpose:** Provides centralized logging (using Winston), with plans for Sentry integration.

### 8. Notifications Module
- **Location:** `notifications/notifications.js`
- **Purpose:** Manages real-time notifications including push alerts and email updates.

### 9. Orders Module
- **Location:** `orders/orders.js`
- **Purpose:** Processes orders and tracks the delivery status.

### 10. OTP Module
- **Location:** `otp/`
- **Files:**
  - `otp_generator.js` – Generates one-time passwords.
  - `otp_storage.js` – Temporarily stores OTPs with expiration.
  - `otp_verifier.js` – Validates OTPs upon user entry.

### 11. Payments Module
- **Location:** `payments/payments.js`
- **Purpose:** Processes payments and integrates with wallet and payment gateways.

### 12. Translation Module
- **Location:** `translation/translation.js`
- **Purpose:** Manages multi-language support (Arabic & English).

### 13. Utils Module
- **Location:** `utils/`
- **Files:**
  - `utils.js` – Contains helper functions and common utilities.
  - `utils.js.bak` – Backup of utilities.

---

## Hosting & Deployment

While the initial plan was to use Firebase hosting, restrictions on Firebase Cloud Functions (requiring card verification) have led to the exploration of alternative serverless solutions. Emphasis is on maintaining low costs during the MVP phase.

---

## Current Development Environment

- **Device:** Oppo A18 mobile using Termux with an Ubuntu environment.
- **Tools:** VS Code Server (with Firefox for improved mouse input response), Bluetooth Keyboard & Mouse app.
- **Internet:** Stable 4G connection.
- **Additional:** Temporary solutions (OTG dongles, power considerations) in place until a proper peripheral setup can be restored.

### PWA Setup for VS Code Server

- **Test Results:**
  - **Chrome PWA:** Despite installing as a PWA, Chrome continues to reload the session like a regular browser and exhibits the persistent mouse click bug.
  - **Firefox "Add to Home Screen":** Merely creates a shortcut, with background persistence issues remaining.
- **Outcome:** PWA approaches did not resolve background tab reloading issues. The plan is to revert to using a desktop environment once available.

---

## Development Challenges & Design Decisions

- **Deferred Views & Controllers:**  
  To focus resources on core application logic, UI and controllers are postponed until later MVP milestones.
- **Work & Environmental Constraints:**  
  Delivery work with high commission fees (~50%) and challenging hardware (mobile-only development, limited peripherals) significantly affect productivity.
- **Battery and OS Limitations:**  
  Mobile operating systems aggressively suspend background processes, impacting long-term development sessions.

---

## Testing & Error Tracking

- **Testing:**  
  Jest is used for unit testing across modules. All tests are located in the `tests/` directory.
- **Error Monitoring:**  
  Logs are managed by Winston, with planned integration of Sentry to enhance error tracking.

---

## Future Enhancements

- **OTP Storage Transition:**  
  Move from in-memory OTP storage to a persistent solution using Firebase.
- **Slack Integration & AI:**  
  Explore automated task tracking through a custom Slack bot and advanced AI tools.
- **Controller and UI Modules:**  
  Post-MVP, focus on developing user interfaces and controllers to complete the delivery workflow.
- **Peripheral Upgrades:**  
  Invest in better OTG hubs or desktop setups to enhance productivity.

---

## Fair Pricing Model

### Objective
This pricing model aims to promote complete transparency between drivers and customers while ensuring that drivers earn a fair income by eliminating the high commissions imposed by traditional delivery platforms. The system grants drivers the freedom to set their own prices while customers cover the waiting cost, ensuring prompt and efficient deliveries.

### Core Principles

- **Platform Commission Capped at 10%:**  
  Unlike competitor platforms that may take up to 50%, the commission here never exceeds 10%.
- **Customer Pays for Waiting Time:**  
  Waiting time is charged to the customer on an hourly basis with a predetermined rate.
- **Driver-Determined Pricing:**  
  Every driver determines his own delivery and waiting fees based on current conditions.
- **Actual Route Distance Calculation:**  
  Fare calculations are based on the actual fastest ground route rather than a straight-line distance.
- **Comprehensive Distance Measurement:**  
  The total journey from the driver's location to the pickup point and then to the delivery point is accounted for.
- **Estimated Fare Provided:**  
  The platform displays an estimated fare; however, the final price is agreed upon directly between the driver and customer.
- **Driver Bidding on Orders:**  
  Drivers submit offers on available orders based on their evaluation, fostering fair competition and flexibility.

### Workflow

1. **Order Selection:**  
   Drivers review orders with an estimated total distance and fare, but set final prices independently.
2. **Offer Submission:**  
   Drivers submit a pricing offer based on the distance and their own operational conditions.
3. **Customer Agreement:**  
   Customers review offers and select the most appropriate one.
4. **Order Execution:**  
   Orders are executed as per the mutually agreed terms.

### Competitive Advantages

- **Driver Protection:**  
  With platform fees capped at 10%, drivers maintain a larger share of the earnings.
- **Incentivizes Faster Delivery:**  
  Charging waiting time to the customer encourages prompt deliveries.
- **Accurate Fare Representation:**  
  Fares reflect the actual route taken rather than a simple estimation.
- **Dynamic and Flexible:**  
  The model allows for personalized pricing, ensuring benefits for both drivers and customers.

---

## Notes & Recommendations

- **Documentation:**  
  Regular updates to this document are essential to reflect new changes, design decisions, and enhancements.
- **Peripheral Upgrades:**  
  Investing in improved hardware (or transitioning to a desktop setup when possible) will greatly enhance productivity.
- **Focus on Sustainability:**  
  The fair pricing model and overall platform design aim to create a more sustainable, equitable delivery service for all parties involved.