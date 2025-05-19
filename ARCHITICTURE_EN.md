# Badr Delivery Platform Architecture / منصة بدر لأعمال الدليفري

**Last Updated:** 2025-05-19 03:55 (UTC+2)

---

## Table of Contents

- [Overview](#overview)
- [Motivation & Background](#motivation--background)
- [AI Agent Commands](#ai-agent-commands)
- [Team Collaboration Plan](#team-collaboration-plan)
- [Directory Structure (Condensed)](#directory-structure-condensed)
- [Module Breakdown and Function Tree](#module-breakdown-and-function-tree)
- [Additional Modules for MVP](#additional-modules-for-mvp)
- [Sprint 1 – Implementation & Testing Plan](#sprint-1--implementation--testing-plan)
- [Change Log](#change-log)
- [Notes & Recommendations](#notes--recommendations)
- [Saving Instructions](#saving-instructions)

---

## Overview

The Badr Delivery Platform is a modern delivery application built with a modular architecture. The original monolithic code has been refactored into domain-specific modules within the `src/modules` folder. All constants are defined in **SCREAMING_SNAKE_CASE** and functions use **snake_case**. This document details our architectural decisions, module responsibilities, our team collaboration plan, and the accompanying change history.

---

## Motivation & Background

Inspired by real-world experiences in the delivery industry and the challenges with traditional platforms, Badr Delivery Platform is designed to empower couriers through transparency and fair pricing. Our solution addresses hidden fees, inefficient routing, and complex operational challenges by leveraging modern software design principles. Our combined expertise in QA, iOS, and web development ensures a robust, innovative platform.

---

## AI Agent Commands

Our system leverages a layered AI assistance model with the following roles:
- **Microsoft Copilot (Main Assistant):** Offers low-code solutions, detailed guidance, and maintains architectural documentation.
- **ChatGPT (Secondary Assistant):** Provides supplementary ideas, creative problem-solving, and troubleshooting support.
- **Amr (Project Owner):** Drives the overall project vision, sets priorities, and makes critical decisions.

**Central Command:**
- **SAVE:** When issued, the AI Agent outputs the current version of this ARCHITECTURE.md file, capturing all design decisions and updates.

---

## Team Collaboration Plan

### Roles and Responsibilities
- **Amr (Lead Developer/Project Owner):**
  - Sets project vision and overall priorities.
  - Makes final decisions on design and business aspects.
  - Ensures system coherence by reviewing deliverables.
- **Microsoft Copilot (Main Assistant):**
  - Provides efficient, low-code, and well-structured technical solutions.
  - Assists with code refactoring and integration of the modular design.
  - Documents decisions and maintains architectural consistency.
- **ChatGPT (Secondary Assistant):**
  - Acts as a backup for additional ideas and creative problem solving.
  - Supports brainstorming, research, and troubleshooting.
  - Supplements detailed documentation as needed.

### Best Practices
- **Clear Task Allocation:** Utilize a Kanban board (e.g., Trello or GitHub Projects) to assign tasks per module.
- **Daily Stand-ups:** Hold brief check-ins to sync progress and address blockers.
- **Code Reviews & CI/CD:** Employ a Git branching strategy with mandatory reviews and automated tests.
- **Consistent Documentation:** Regularly update this ARCHITECTURE.md file along with any other key project documentation.
- **Retrospectives:** Conduct periodic reviews to adjust processes and practices.

---

## Directory Structure (Condensed)

- **admin:** `admin_dashboard.js` – Admin dashboard and reporting.
- **api:** `routes.js`, `server.js` – API endpoints and server initialization.
- **auth:** `auth.js` – User authentication and authorization.
- **config:** `constants.js` – Global constants (SCREAMING_SNAKE_CASE).
- **database:** `db.js` – Database interactions using Firebase Admin.
- **error:** `error_handler.js` – Centralized error handling with Winston.
- **global:** `locator.js` – Global variables for courier tracking.
- **helpers:** `distance.js`, `utils.js` – Utility functions for distance calculations and PIN generation.
- **localization:** `localization.js` – Handles localized text retrieval, translation (stub), and voice notifications.
- **notifier:** `notifier.js` – Sends notifications/messages to users.
- **orders:** `order_manager.js` – Order and bid management.
- **realtime:** `socket.js` – Real-time communication via Socket.io.
- **scheduler:** `task_scheduler.js` – Scheduled tasks (using node-cron).
- **users:** `profile.js` – User profile management (CRUD).
- **wallet:** `wallet_manager.js` – Wallet and fee management.
- **index.js** – Main entry point to start the application.

---

## Module Breakdown and Function Tree

| **Function/Constant/Variable**              | **Old Category**          | **Module/Domain**        | **File Path**                                       |
|---------------------------------------------|---------------------------|--------------------------|-----------------------------------------------------|
| `last_location`                             | Global Variable           | Global (locator)         | `src/modules/global/locator.js`                     |
| `last_update_time`                          | Global Variable           | Global (locator)         | `src/modules/global/locator.js`                     |
| `R`                                         | Constant                  | Config                   | `src/modules/config/constants.js`                   |
| `API_KEY`                                   | Constant                  | Config                   | `src/modules/config/constants.js`                   |
| `AVERAGE_SPEED`                             | Constant                  | Config                   | `src/modules/config/constants.js`                   |
| `SYSTEM_COMMISSION_RATE`                    | Constant                  | Config                   | `src/modules/config/constants.js`                   |
| `WAITING_TIMEOUT`                           | Constant                  | Config                   | `src/modules/config/constants.js`                   |
| `CASH_BLOCK`                                | Constant                  | Config                   | `src/modules/config/constants.js`                   |
| `get_haversine_distance`                    | Helper Function           | Helpers – Distance       | `src/modules/helpers/distance.js`                   |
| `get_fastest_route_info`                    | Helper Function           | Helpers – Distance       | `src/modules/helpers/distance.js`                   |
| `generate_pickup_pin`                       | Helper Function           | Helpers – Utils          | `src/modules/helpers/utils.js`                      |
| `create_order`                              | Order & Bid Management    | Orders Module            | `src/modules/orders/order_manager.js`               |
| `place_bid`                                 | Order & Bid Management    | Orders Module            | `src/modules/orders/order_manager.js`               |
| `accept_bid`                                | Order & Bid Management    | Orders Module            | `src/modules/orders/order_manager.js`               |
| `get_reserved_amount_for_customer`          | Order & Bid Management    | Orders Module            | `src/modules/orders/order_manager.js`               |
| `get_reserved_amount_for_order`             | Order & Bid Management    | Orders Module            | `src/modules/orders/order_manager.js`               |
| `designate_primary_courier`                 | Order & Bid Management    | Orders Module            | `src/modules/orders/order_manager.js`               |
| `get_affordable_orders`                     | Order Filtering           | Orders Module            | `src/modules/orders/order_manager.js`               |
| `record_pickup_arrival`                     | Pickup & Dropoff Workflow | Workflow Module          | `src/modules/workflow/pickup_dropoff.js`            |
| `confirm_pickup`                            | Pickup & Dropoff Workflow | Workflow Module          | `src/modules/workflow/pickup_dropoff.js`            |
| `record_dropoff_arrival`                    | Pickup & Dropoff Workflow | Workflow Module          | `src/modules/workflow/pickup_dropoff.js`            |
| `confirm_dropoff`                           | Pickup & Dropoff Workflow | Workflow Module          | `src/modules/workflow/pickup_dropoff.js`            |
| `get_courier_wallet_balance`                | Wallet & Fee Management   | Wallet Module            | `src/modules/wallet/wallet_manager.js`              |
| `get_system_wallet_balance`                 | Wallet & Fee Management   | Wallet Module            | `src/modules/wallet/wallet_manager.js`              |
| `transfer_fees_to_system_wallet`            | Wallet & Fee Management   | Wallet Module            | `src/modules/wallet/wallet_manager.js`              |
| `finalize_order`                            | Wallet & Fee Management   | Wallet Module            | `src/modules/wallet/wallet_manager.js`              |
| `deposit_to_customer_wallet`                | Customer Wallet           | Wallet Module            | `src/modules/wallet/wallet_manager.js`              |
| `get_localized_text`                        | Localization              | Localization Module      | `src/modules/localization/localization.js`          |
| `translate_api`                             | Localization              | Localization Module      | `src/modules/localization/localization.js`          |
| `play_localized_voice_notification`         | Localization              | Localization Module      | `src/modules/localization/localization.js`          |
| `notify_courier`                            | Notification              | Notifier Module          | `src/modules/notifier/notifier.js`                  |
| `notify_customer`                           | Notification              | Notifier Module          | `src/modules/notifier/notifier.js`                  |
| `login`                                     | Authentication            | Auth Module              | `src/modules/auth/auth.js`                          |
| `register`                                  | Authentication            | Auth Module              | `src/modules/auth/auth.js`                          |
| `auth_middleware`                           | Authentication            | Auth Module              | `src/modules/auth/auth.js`                          |
| `create_user`                               | User Profile Management   | Users Module             | `src/modules/users/profile.js`                      |
| `get_user_by_email`                         | User Profile Management   | Users Module             | `src/modules/users/profile.js`                      |
| `update_user`                               | User Profile Management   | Users Module             | `src/modules/users/profile.js`                      |
| `delete_user`                               | User Profile Management   | Users Module             | `src/modules/users/profile.js`                      |
| **API Routes**                              | API/Route Controllers     | API Module               | `src/modules/api/routes.js` & `src/modules/api/server.js` |
| **Real-time Communication**                 | (Order tracking, etc.)    | Realtime Module          | `src/modules/realtime/socket.js`                    |
| **Error Handling**                          | (Global management)       | Error Module             | `src/modules/error/error_handler.js`              |
| **Task Scheduling**                         | (Recurring tasks)         | Scheduler Module         | `src/modules/scheduler/task_scheduler.js`         |
| **Admin Dashboard / Reporting**             | (Admin insights)          | Admin Module             | `src/modules/admin/admin_dashboard.js`            |

---

## Additional Modules for MVP

In addition to the original 25 functions migrated into domain-specific modules, the following modules have been set up or stubbed to complete our MVP:

- **Authentication & Authorization (Auth Module):** Handles login, registration, and JWT-based route protection.
- **User Profile Management (Users Module):** Provides CRUD operations for couriers and customers.
- **API/Route Controllers (API Module):** Exposes RESTful endpoints for authentication, orders, and workflow actions.
- **Database Management (Database Module):** Wraps Firestore interactions using the Firebase Admin SDK.
- **Real-time Communication (Realtime Module):** Enables live tracking updates and notifications via Socket.io.
- **Error Handling (Error Module):** Centralizes error tracking using Winston (expandable with Sentry).
- **Scheduling/Task Runner (Scheduler Module):** Manages recurring tasks (e.g., OTP cleanup) with node-cron.
- **Administrative Dashboard (Admin Module):** Provides metrics, reporting, and insights for admin use.
- **Localization (Localization Module):** Dedicated to localized text retrieval, translation (stub), and voice notifications.
- **Notifier (Notifier Module):** Focused solely on sending notifications without embedded localization logic.

---

## Sprint 1 – Implementation & Testing Plan

This section outlines our plan and schedule for Sprint 1, which will bring the MVP to a fully functional state.

### **Phase 1: Preparation (Day 1)**
- **Kickoff Meeting & Task Allocation:**  
  - Identify interfaces for each module and assign clear responsibilities.
  - Set up Git branching strategy, testing framework (e.g., Jest/Mocha), and CI/CD pipeline.
  
### **Phase 2: Implementation (Days 2–7)**
- **Days 2–3: Core Modules**
  - Implement authentication flows and API endpoints.
  - Develop and test CRUD operations in the User Profile module.
- **Day 4: Orders & Wallet Modules**
  - Complete order creation, bid processing, and wallet transactions.
  - Write unit tests for each operation.
- **Day 5: Helpers, Global & Config Modules**
  - Finalize helper functions (distance calculations, PIN generation).
  - Verify global variables and configuration constants.
- **Day 6: Notifier, Localization, Realtime & Scheduler Modules**
  - Implement and test notifier functions and localization stubs.
  - Ensure Socket.io for real-time updates and schedule periodic tasks.
- **Day 7: Integration of Core Modules**
  - Integrate modules via the main entry point.
  - Run integration tests across modules.

### **Phase 3: Integration & End-to-End Testing (Days 8–12)**
- **Day 8:** Perform comprehensive integration testing using the CI pipeline.
- **Days 9–10:** Execute end-to-end user scenario tests and basic load/performance tests.
- **Day 11:** Conduct a full code review and resolve reported bugs.
- **Day 12:** Final QA, documentation updates, and test suite finalization.

### **Phase 4: Deployment Preparation (Days 13–14)**
- **Day 13:** Buffer day for any last integration issues and prepare the release candidate.
- **Day 14:** Sprint review, team retrospective, and planning for the subsequent sprint.

#### **Sample Schedule Table**

| **Day**   | **Tasks**                                                   | **Responsible Parties**     |
|-----------|-------------------------------------------------------------|-----------------------------|
| Day 1     | Kickoff, allocate tasks, set up CI/CD and testing framework   | Amr, Copilot, ChatGPT       |
| Days 2–3  | Implement Auth & API endpoints; Unit tests for Auth; Users CRUD | Amr & Copilot               |
| Day 4     | Develop Orders & Wallet modules; Write respective unit tests   | Amr, Copilot                |
| Day 5     | Finalize Helpers, Global, & Config modules; Add unit tests       | Copilot, ChatGPT            |
| Day 6     | Implement Notifier, Localization, Realtime, Scheduler; Write tests | Copilot, ChatGPT           |
| Day 7     | Integrate core modules; Run integration tests                    | Amr, Copilot                |
| Day 8     | Run comprehensive integration tests                              | Amr & Team                  |
| Days 9–10| Conduct end-to-end testing and performance/load tests              | Amr, Copilot, ChatGPT       |
| Day 11    | Code review and bug fixing; refine tests                          | Amr, Copilot, ChatGPT       |
| Day 12    | Final QA, update documentation, finalize test suites               | Amr & Team                  |
| Day 13    | Buffer day; final integration and release prep                     | Amr, Copilot                |
| Day 14    | Sprint review, retrospective, and planning for future iterations      | Amr, Copilot, ChatGPT       |

---

## Change Log

- **2025-05-19 00:00 (UTC+2):** Introduced mandatory timestamps in communications.
- **2025-05-19 00:15 (UTC+2):** Added AI Agent Commands section with the `SAVE` command.
- **2025-05-19 00:35 (UTC+2):** Updated ARCHITECTURE.md and integrated project naming.
- **2025-05-19 01:55 (UTC+2):** Migrated 25 functions from the original monolithic `index.js` into domain-specific modules.
- **2025-05-19 02:00–02:10 (UTC+2):** Completed refactor into a modular architecture with SCREAMING_SNAKE_CASE for constants.
- **2025-05-19 02:30 (UTC+2):** Separated localization into its own dedicated module.
- **2025-05-19 03:05 (UTC+2):** Added Motivation & Background and AI Agent Commands sections.
- **2025-05-19 03:35 (UTC+2):** Incorporated Team Collaboration Plan and Best Practices.
- **2025-05-19 03:55 (UTC+2):** Added Sprint 1 – Implementation & Testing Plan.

---

## Notes & Recommendations

- **Maintain Modular Separation:** Continue refining and testing each module independently.
- **Gradually Replace Stubs:** Evolve from placeholders to production-ready logic and integrate external services as needed.
- **Consistent Naming Conventions:** Ensure that all functions and variables follow snake_case, while constants adhere to SCREAMING_SNAKE_CASE.
- **Documentation & Testing:** Keep documentation updated and maintain a high test-coverage standard.

---

## Saving Instructions

*To save this file locally:*
1. Copy the entire content above.
2. Open your text editor (e.g., VS Code, Notepad++).
3. Paste the content.
4. Save the file as `ARCHITECTURE.md`.

---

This document now fully captures our architecture, including the new Sprint 1 plan. The plan is saved in the ARCH file under the "Sprint 1 – Implementation & Testing Plan" section. Let me know if you need any further changes or additions!