# Complete Combined Tasks for Badr Delivery Platform User Stories

## Customer/User Stories

### US-CUS-001: Registration
- **TASK-CUS-001-1:** Design the signup UI supporting email and phone number registration.
- **TASK-CUS-001-2:** Implement OTP integration and verification in the backend.
- **TASK-CUS-001-3:** Add input validation and error handling for signup.
- **TASK-CUS-001-4:** Write unit and integration tests for registration flows.
- **TASK-CUS-001-5:** Update user documentation for the registration process.

### US-CUS-002: Profile Updates
- **TASK-CUS-002-1:** Create an editable profile page for personal details.
- **TASK-CUS-002-2:** Develop a backend API endpoint to handle profile updates.
- **TASK-CUS-002-3:** Implement both client-side and server-side validation.
- **TASK-CUS-002-4:** Write tests to verify that updates are saved correctly.
- **TASK-CUS-002-5:** Document the profile update procedure.

### US-CUS-003: Store & Menu Exploration
- **TASK-CUS-003-1:** Design a vendor listing page with menus and ratings.
- **TASK-CUS-003-2:** Develop an API to fetch nearby vendor data.
- **TASK-CUS-003-3:** Implement filtering and sorting for vendor listings.
- **TASK-CUS-003-4:** Write tests for data fetching and rendering.
- **TASK-CUS-003-5:** Update UI documentation regarding vendor exploration.

### US-CUS-004: Search & Filter
- **TASK-CUS-004-1:** Implement a search bar component in the UI.
- **TASK-CUS-004-2:** Develop filter controls for cuisines, ratings, and promotions.
- **TASK-CUS-004-3:** Build backend support to process search queries.
- **TASK-CUS-004-4:** Write and conduct tests for search and filter functions.
- **TASK-CUS-004-5:** Update user help materials to explain search functionality.

### US-CUS-005: Order Customization & Placement
- **TASK-CUS-005-1:** Design the order customization UI (cart, custom options).
- **TASK-CUS-005-2:** Develop API endpoints for order creation and customization.
- **TASK-CUS-005-3:** Integrate the UI with payment processing gateways.
- **TASK-CUS-005-4:** Write integration tests for the complete ordering flow.
- **TASK-CUS-005-5:** Document the order placement process.

### US-CUS-006: Upfront Payment Option
- **TASK-CUS-006-1:** Add an upfront payment input field in the order form.
- **TASK-CUS-006-2:** Update the order model to include an upfront payment field.
- **TASK-CUS-006-3:** Modify order matching logic to filter based on upfront payment.
- **TASK-CUS-006-4:** Write tests to validate the upfront payment functionality.
- **TASK-CUS-006-5:** Update payment documentation with the new option.

### US-CUS-007: Specify Number of Couriers
- **TASK-CUS-007-1:** Add a UI element to specify the number of couriers needed.
- **TASK-CUS-007-2:** Update the order model to include a courier count field.
- **TASK-CUS-007-3:** Modify matching algorithms to consider the specified number.
- **TASK-CUS-007-4:** Write tests to verify multi-courier assignment.
- **TASK-CUS-007-5:** Document the process for requesting multiple couriers.

### US-CUS-008: Maximum Pick Distance
- **TASK-CUS-008-1:** Add an input field for maximum pick-up distance in the order form.
- **TASK-CUS-008-2:** Update the order model with the maximum distance parameter.
- **TASK-CUS-008-3:** Modify courier selection logic to filter by distance.
- **TASK-CUS-008-4:** Write unit tests to validate distance filtering.
- **TASK-CUS-008-5:** Update documentation with detailed instructions.

### US-CUS-009: Multi-Payment Options
- **TASK-CUS-009-1:** Create a payment options UI (credit card, mobile wallet, COD).
- **TASK-CUS-009-2:** Integrate payment gateways for non-COD options.
- **TASK-CUS-009-3:** Implement COD logic in the order flow.
- **TASK-CUS-009-4:** Write tests to verify each payment method works.
- **TASK-CUS-009-5:** Document the multi-payment feature details.

### US-CUS-010: Secure Transaction
- **TASK-CUS-010-1:** Integrate an OTP verification step in the payment process.
- **TASK-CUS-010-2:** Update the payment flow UI to prompt for OTP.
- **TASK-CUS-010-3:** Implement server-side OTP validation.
- **TASK-CUS-010-4:** Write end-to-end tests for the secure transaction flow.
- **TASK-CUS-010-5:** Update security documentation for transactions.

### US-CUS-011: Order Confirmation
- **TASK-CUS-011-1:** Create an order confirmation page with details and ETA.
- **TASK-CUS-011-2:** Develop notification triggers (email/push) for order confirmation.
- **TASK-CUS-011-3:** Integrate backend order data to display accurate estimates.
- **TASK-CUS-011-4:** Write tests to verify confirmation messages.
- **TASK-CUS-011-5:** Document the confirmation process.

### US-CUS-012: Complete Address Details
- **TASK-CUS-012-1:** Update the order form with fields for area, street, building, floor, apartment, contact person, and phone.
- **TASK-CUS-012-2:** Modify the data model to store detailed address components.
- **TASK-CUS-012-3:** Implement validation to ensure all mandatory fields are filled.
- **TASK-CUS-012-4:** Write tests for address input and error messages.
- **TASK-CUS-012-5:** Document the required address format.

### US-CUS-013: View Courier Profile on Bid
- **TASK-CUS-013-1:** Create a UI view for detailed courier profiles accessible from bids.
- **TASK-CUS-013-2:** Develop an API endpoint to retrieve courier profile details (completed orders, rates, reviews, earnings, join date).
- **TASK-CUS-013-3:** Add functionalities to favourite or block a courier.
- **TASK-CUS-013-4:** Write integration tests for profile retrieval and actions.
- **TASK-CUS-013-5:** Document the courier profile features.

### US-CUS-014: Real-Time Tracking
- **TASK-CUS-014-1:** Develop a live tracking UI showing order status and courier location.
- **TASK-CUS-014-2:** Integrate real-time data updates using WebSockets or polling.
- **TASK-CUS-014-3:** Ensure order status changes are propagated to the client.
- **TASK-CUS-014-4:** Write tests simulating real-time updates.
- **TASK-CUS-014-5:** Update documentation on tracking functionality.

### US-CUS-015: Accurate Delivery Time Estimation
- **TASK-CUS-015-1:** Integrate a third-party routing API to calculate fastest routes.
- **TASK-CUS-015-2:** Develop backend logic to estimate delivery times based on routes.
- **TASK-CUS-015-3:** Display the estimated time on the confirmation page.
- **TASK-CUS-015-4:** Validate the estimation with test scenarios.
- **TASK-CUS-015-5:** Document the estimation methodology.

### US-CUS-016: Push & In-App Notifications
- **TASK-CUS-016-1:** Develop a notification service to send push alerts.
- **TASK-CUS-016-2:** Build an in-app notifications center.
- **TASK-CUS-016-3:** Create backend triggers on relevant order events.
- **TASK-CUS-016-4:** Write tests to simulate notification delivery.
- **TASK-CUS-016-5:** Document notification settings and troubleshooting.

### US-CUS-017: Order History & Reordering
- **TASK-CUS-017-1:** Design an order history interface.
- **TASK-CUS-017-2:** Develop an API to fetch past orders for a customer.
- **TASK-CUS-017-3:** Implement a quick reorder feature.
- **TASK-CUS-017-4:** Write tests to validate data retrieval and reorder functionality.
- **TASK-CUS-017-5:** Update documentation on order history features.

### US-CUS-018: Rating & Feedback on Service (Customer)
- **TASK-CUS-018-1:** Design a review form with star rating and a text box.
- **TASK-CUS-018-2:** Develop an API endpoint to submit ratings and comments.
- **TASK-CUS-018-3:** Integrate the review submission with order completion events.
- **TASK-CUS-018-4:** Write tests for validation and storage of reviews.
- **TASK-CUS-018-5:** Document the feedback mechanism.

### US-CUS-019: Review of Other Participants (Customer)
- **TASK-CUS-019-1:** Extend the review module to allow reviews for both courier and merchant after order completion.
- **TASK-CUS-019-2:** Create backend endpoints to manage multi-party reviews.
- **TASK-CUS-019-3:** Write tests to ensure reviews are correctly linked to orders.
- **TASK-CUS-019-4:** Update documentation on multi-party review guidelines.

### US-CUS-020: System Performance Review (Customer)
- **TASK-CUS-020-1:** Implement a system performance review form in the post-order flow.
- **TASK-CUS-020-2:** Develop an endpoint to capture system feedback.
- **TASK-CUS-020-3:** Validate user inputs and store data.
- **TASK-CUS-020-4:** Write tests to verify feedback submission.
- **TASK-CUS-020-5:** Document how this feedback is used.

### US-CUS-021: Customer Support Access
- **TASK-CUS-021-1:** Build an in-app support or ticketing interface.
- **TASK-CUS-021-2:** Integrate support requests with a backend ticket management system.
- **TASK-CUS-021-3:** Implement notification updates for ticket status.
- **TASK-CUS-021-4:** Write tests to simulate support interactions.
- **TASK-CUS-021-5:** Update support documentation.

### US-CUS-022: Create a Package Delivery Order
- **TASK-CUS-022-1:** Design an order creation UI with flexible pickup and drop-off address fields.
- **TASK-CUS-022-2:** Update the backend order creation API to support addresses from anywhere.
- **TASK-CUS-022-3:** Enhance data models to store complete address details.
- **TASK-CUS-022-4:** Implement comprehensive input validations.
- **TASK-CUS-022-5:** Write integration tests for the flexible order process.
- **TASK-CUS-022-6:** Update FAQs and documentation to describe the package delivery order flow.

### US-CUS-023: Select Delivery Vehicle
- **TASK-CUS-023-1:** Add a dropdown/selection component for delivery vehicles in the order form.
- **TASK-CUS-023-2:** Update the backend to return allowed vehicle types (cars, bikes, walkers, etc.).
- **TASK-CUS-023-3:** Validate the selected vehicle type.
- **TASK-CUS-023-4:** Write tests for the delivery vehicle selection feature.
- **TASK-CUS-023-5:** Document the available vehicle options.

### US-BIL-001: Apply System Commission
- **TASK-BIL-001-1:** Implement backend logic to calculate a 10% commission on courier fees.
- **TASK-BIL-001-2:** Ensure the commission is applied automatically upon fee calculation.
- **TASK-BIL-001-3:** Write tests to verify proper commission calculation.
- **TASK-BIL-001-4:** Document the commission model.

### US-BIL-002: Calculate Courier & Waiting Fees
- **TASK-BIL-002-1:** Develop logic to use the courier’s bid value as the base fee.
- **TASK-BIL-002-2:** Integrate calculation for waiting fees starting after a 5-minute delay at pickup/drop-off.
- **TASK-BIL-002-3:** Validate fee calculations with test scenarios.
- **TASK-BIL-002-4:** Document the fee and waiting fee structure.

### US-URP-001: Block/Favourite Other Users
- **TASK-URP-001-1:** Extend user profile UI to include actions for adding/removing from favourite and block lists.
- **TASK-URP-001-2:** Update backend APIs to handle favourite/block list modifications.
- **TASK-URP-001-3:** Ensure the changes are reflected in user interactions in real time.
- **TASK-URP-001-4:** Write tests for the block/favourite functionality.
- **TASK-URP-001-5:** Update documentation with guidelines on user relationships.

## Merchant/Vendor Stories

### US-MER-001: Merchant Registration & Profile Setup
- **TASK-MER-001-1:** Design a merchant-specific registration UI.
- **TASK-MER-001-2:** Implement verification (document uploads) and profile creation endpoints.
- **TASK-MER-001-3:** Update the merchant profile model with location, contact, and operating hours.
- **TASK-MER-001-4:** Write tests for the onboarding flow.
- **TASK-MER-001-5:** Document the merchant registration process.

### US-MER-002: Menu Management
- **TASK-MER-002-1:** Design an intuitive UI for managing menu items.
- **TASK-MER-002-2:** Develop CRUD API endpoints for menu management.
- **TASK-MER-002-3:** Implement input validations and error handling for menu updates.
- **TASK-MER-002-4:** Write unit and integration tests for menu operations.
- **TASK-MER-002-5:** Document the process for adding/updating menu items.

### US-MER-003: Order Reception & Status Updates (Merchant)
- **TASK-MER-003-1:** Build a merchant dashboard for real-time order alerts.
- **TASK-MER-003-2:** Develop API endpoints to update order statuses.
- **TASK-MER-003-3:** Integrate real-time notifications for order events.
- **TASK-MER-003-4:** Write tests for the order reception and update flows.
- **TASK-MER-003-5:** Document the order management workflow.

### US-MER-004: Promotion & Discount Management
- **TASK-MER-004-1:** Design UI components for creating and managing promotions.
- **TASK-MER-004-2:** Create API endpoints for promotion CRUD operations.
- **TASK-MER-004-3:** Implement logic to enforce discount rules and expiration.
- **TASK-MER-004-4:** Write tests to validate promotion functionality.
- **TASK-MER-004-5:** Update documentation on managing promotions and discounts.

### US-MER-005: Performance Metrics (Merchant)
- **TASK-MER-005-1:** Build analytic dashboards to show sales, customer feedback, and order volumes.
- **TASK-MER-005-2:** Develop backend aggregation endpoints for performance data.
- **TASK-MER-005-3:** Integrate graphical representations (charts/graphs) into the dashboard.
- **TASK-MER-005-4:** Write tests to verify data accuracy.
- **TASK-MER-005-5:** Document the metrics and how to interpret them.

### US-MER-006: Review of Other Participants (Merchant)
- **TASK-MER-006-1:** Extend the merchant order completion flow to allow reviews for courier and customer.
- **TASK-MER-006-2:** Develop endpoints for submitting and fetching reviews.
- **TASK-MER-006-3:** Write tests to ensure reviews are properly linked to orders.
- **TASK-MER-006-4:** Document the review process for merchants.

### US-MER-007: System Performance Review (Merchant)
- **TASK-MER-007-1:** Implement a performance review form in the merchant interface.
- **TASK-MER-007-2:** Create API endpoints for submitting system performance feedback.
- **TASK-MER-007-3:** Write tests for feedback submission and storage.
- **TASK-MER-007-4:** Update documentation with guidelines on providing system feedback.

## Courier/Delivery Agent Stories

### US-COU-001: Courier Registration
- **TASK-COU-001-1:** Develop registration screens tailored for couriers.
- **TASK-COU-001-2:** Implement document upload and verification processes.
- **TASK-COU-001-3:** Create API endpoints for courier registration.
- **TASK-COU-001-4:** Write tests for the registration and verification flows.
- **TASK-COU-001-5:** Document the courier onboarding process.

### US-COU-002: Set Availability Status
- **TASK-COU-002-1:** Add a toggle in the courier app to set online/offline status.
- **TASK-COU-002-2:** Update the courier profile model with availability status.
- **TASK-COU-002-3:** Ensure real-time propagation of status in the matching system.
- **TASK-COU-002-4:** Write tests for verifying status changes.
- **TASK-COU-002-5:** Document the status management process.

### US-COU-003: Set Fee per Kilometer
- **TASK-COU-003-1:** Add an input for km rate in the courier settings UI.
- **TASK-COU-003-2:** Update the backend to store and retrieve courier km fees.
- **TASK-COU-003-3:** Validate input and enforce acceptable bounds.
- **TASK-COU-003-4:** Write tests for km fee input.
- **TASK-COU-003-5:** Document guidelines for setting the km rate.

### US-COU-004: Set Waiting Fee per Hour
- **TASK-COU-004-1:** Add a waiting fee input in the courier settings.
- **TASK-COU-004-2:** Update the data model to include waiting fee values.
- **TASK-COU-004-3:** Implement validation and error handling.
- **TASK-COU-004-4:** Write tests for the waiting fee configuration.
- **TASK-COU-004-5:** Document the waiting fee setup.

### US-COU-005: Available Budget Filter
- **TASK-COU-005-1:** Add a field for setting an available budget in the courier profile.
- **TASK-COU-005-2:** Update order retrieval APIs to filter orders by budget.
- **TASK-COU-005-3:** Write tests to ensure filtering works as expected.
- **TASK-COU-005-4:** Document how the available budget affects order matching.

### US-COU-006: View Customer Profile on Published Orders
- **TASK-COU-006-1:** Create a detailed customer profile view in the courier app.
- **TASK-COU-006-2:** Develop an API to fetch customer data (spending, orders, reviews, join date).
- **TASK-COU-006-3:** Add functionalities to mark customer as favourite or block.
- **TASK-COU-006-4:** Write tests for data accuracy and UI actions.
- **TASK-COU-006-5:** Document the customer profile view.

### US-COU-007: Block Areas (Geo-Filtering)
- **TASK-COU-007-1:** Design a map interface for couriers to draw or select blocked areas.
- **TASK-COU-007-2:** Update the courier profile to store coordinates of blocked regions.
- **TASK-COU-007-3:** Adjust order matching logic to exclude orders in blocked areas.
- **TASK-COU-007-4:** Write tests to validate the geo-filtering.
- **TASK-COU-007-5:** Document the process for setting block areas.

### US-COU-008: Order Notifications & Details (Courier)
- **TASK-COU-008-1:** Build a notifications interface for new order alerts.
- **TASK-COU-008-2:** Create API endpoints to push detailed order information.
- **TASK-COU-008-3:** Ensure that all necessary order details (pickup, drop-off, instructions) are included.
- **TASK-COU-008-4:** Write tests to simulate notification delivery.
- **TASK-COU-008-5:** Document the order notification system.

### US-COU-009: Fastest Route Calculation (Courier)
- **TASK-COU-009-1:** Integrate with a routing API (e.g., Google Maps) to calculate routes.
- **TASK-COU-009-2:** Develop backend logic to choose the fastest route considering current traffic.
- **TASK-COU-009-3:** Display route details and estimated times in the courier app.
- **TASK-COU-009-4:** Write tests for route computations.
- **TASK-COU-009-5:** Document the routing algorithm.

### US-COU-010: Submit Order Bids
- **TASK-COU-010-1:** Design a bidding interface within the courier app.
- **TASK-COU-010-2:** Develop an API endpoint for submitting courier bids.
- **TASK-COU-010-3:** Incorporate courier fee and waiting fee calculations into the bid.
- **TASK-COU-010-4:** Write tests to ensure bids are accurately stored.
- **TASK-COU-010-5:** Document the bidding process.

### US-COU-011: Order Status Updates (Courier)
- **TASK-COU-011-1:** Add UI controls (buttons) for courier status updates (picked up, delivered).
- **TASK-COU-011-2:** Create API endpoints for updating order status.
- **TASK-COU-011-3:** Implement real-time synchronization with customers and merchants.
- **TASK-COU-011-4:** Write tests for state transition flows.
- **TASK-COU-011-5:** Document the status update process.

### US-COU-012: Earnings Dashboard
- **TASK-COU-012-1:** Design a dashboard that displays completed orders and earnings.
- **TASK-COU-012-2:** Develop API endpoints to aggregate earnings data.
- **TASK-COU-012-3:** Integrate graphical charts to visualize earnings trends.
- **TASK-COU-012-4:** Write tests to validate dashboard data.
- **TASK-COU-012-5:** Document how to use the earnings dashboard.

### US-COU-013: Rating & Feedback on Service (Courier)
- **TASK-COU-013-1:** Display customer feedback on the courier’s profile.
- **TASK-COU-013-2:** Develop an API to fetch and show customer ratings.
- **TASK-COU-013-3:** Write tests to ensure proper feedback presentation.
- **TASK-COU-013-4:** Document the feedback review process.

### US-COU-014: Review of Other Participants (Courier)
- **TASK-COU-014-1:** Extend the post-order flow to include review submission for the customer and merchant.
- **TASK-COU-014-2:** Create API endpoints for submitting courier reviews.
- **TASK-COU-014-3:** Write tests linking reviews to the correct orders.
- **TASK-COU-014-4:** Document the review process for couriers.

### US-COU-015: System Performance Review (Courier)
- **TASK-COU-015-1:** Implement a performance review form in the courier app post-delivery.
- **TASK-COU-015-2:** Create an API endpoint for submitting performance feedback.
- **TASK-COU-015-3:** Validate the data before storing.
- **TASK-COU-015-4:** Write tests for the feedback mechanism.
- **TASK-COU-015-5:** Update documentation on how feedback is utilized.

### US-COU-020: Pickup PIN Verification
- **TASK-COU-020-1:** Design a UI element to display the pickup PIN at the pickup stage.
- **TASK-COU-020-2:** Implement backend logic to generate a unique pickup PIN.
- **TASK-COU-020-3:** Integrate the PIN with the order pickup process.
- **TASK-COU-020-4:** Write tests to simulate PIN generation and verification.
- **TASK-COU-020-5:** Document the pickup PIN verification process.

### US-COU-021: Drop-off PIN Verification
- **TASK-COU-021-1:** Create a UI prompt for the courier to enter the drop-off PIN.
- **TASK-COU-021-2:** Implement backend validation to compare the entered PIN with the generated one.
- **TASK-COU-021-3:** Establish safeguards (e.g., limited attempts).
- **TASK-COU-021-4:** Write tests for PIN verification at drop-off.
- **TASK-COU-021-5:** Document the drop-off PIN process.

### US-COU-022: Request Additional Couriers
- **TASK-COU-022-1:** Add a UI option for the courier to request assistance on an order.
- **TASK-COU-022-2:** Update the order model to support multiple courier assignments.
- **TASK-COU-022-3:** Implement backend logic to process additional courier requests.
- **TASK-COU-022-4:** Write tests to simulate multi-courier requests.
- **TASK-COU-022-5:** Document the process for requesting extra couriers.

### US-COU-023: Primary Courier Selection Logic
- **TASK-COU-023-1:** Define performance metrics (completed orders, average rating, on-time percentage) and propose a selection formula.
- **TASK-COU-023-2:** Implement backend logic to compute the Primary Courier Score.
- **TASK-COU-023-3:** Integrate automatic selection when multiple couriers are assigned.
- **TASK-COU-023-4:** Write tests to confirm the correct primary courier is selected.
- **TASK-COU-023-5:** Document the selection formula and process.

## Administrator/Platform Manager Stories

### US-ADM-001: Admin Dashboard
- **TASK-ADM-001-1:** Design a responsive dashboard UI for admin use.
- **TASK-ADM-001-2:** Develop API endpoints to aggregate data on orders, user activities, and performance.
- **TASK-ADM-001-3:** Integrate visualization tools (charts/graphs) into the dashboard.
- **TASK-ADM-001-4:** Write tests to ensure data accuracy.
- **TASK-ADM-001-5:** Document dashboard features and usage.

### US-ADM-002: User & Account Management
- **TASK-ADM-002-1:** Build an interface for managing user accounts (customers, couriers, merchants).
- **TASK-ADM-002-2:** Develop API endpoints for account approval, suspension, and removal.
- **TASK-ADM-002-3:** Implement audit logging for account management actions.
- **TASK-ADM-002-4:** Write tests for access control and account actions.
- **TASK-ADM-002-5:** Document the account management process.

### US-ADM-003: Order and Dispute Management
- **TASK-ADM-003-1:** Create a dashboard view for active orders and disputes.
- **TASK-ADM-003-2:** Develop workflows for resolving disputes and processing refunds.
- **TASK-ADM-003-3:** Write tests for dispute management scenarios.
- **TASK-ADM-003-4:** Document dispute resolution processes.

### US-ADM-004: Reporting & Analytics
- **TASK-ADM-004-1:** Build reporting tools to generate detailed analytics.
- **TASK-ADM-004-2:** Develop backend endpoints for data aggregation on key performance metrics.
- **TASK-ADM-004-3:** Integrate visualization components on the admin dashboard.
- **TASK-ADM-004-4:** Write tests to verify report accuracy.
- **TASK-ADM-004-5:** Document available reports and analytics.

### US-ADM-005: Security Settings & Audit Logs
- **TASK-ADM-005-1:** Design an admin interface for configuring security settings.
- **TASK-ADM-005-2:** Implement audit log functionality for user actions and system events.
- **TASK-ADM-005-3:** Write tests ensuring security settings are applied.
- **TASK-ADM-005-4:** Document security policies and audit log procedures.

### US-ADM-006: Aggregated Review Analytics for Administrators
- **TASK-ADM-006-1:** Develop tooling to aggregate review and rating data across the platform.
- **TASK-ADM-006-2:** Create API endpoints to retrieve aggregated review metrics.
- **TASK-ADM-006-3:** Integrate the data into the admin dashboard.
- **TASK-ADM-006-4:** Write tests to validate aggregated results.
- **TASK-ADM-006-5:** Document how aggregated reviews are used for performance monitoring.

## System/Operational & Development Stories

### US-SYS-001: Microservices Architecture
- **TASK-SYS-001-1:** Architect the system using a microservices framework.
- **TASK-SYS-001-2:** Define services boundaries and inter-service communication protocols.
- **TASK-SYS-001-3:** Document the architecture design.
- **TASK-SYS-001-4:** Write integration tests for service interactions.

### US-SYS-002: API Documentation & Integration
- **TASK-SYS-002-1:** Ensure all API endpoints are well-documented.
- **TASK-SYS-002-2:** Develop integration guides for internal and third-party usage.
- **TASK-SYS-002-3:** Write tests to verify API responses.
- **TASK-SYS-002-4:** Publish full API documentation.

### US-SYS-003: Calculation of Fastest Routes (System)
- **TASK-SYS-003-1:** Integrate a routing API to calculate fastest routes.
- **TASK-SYS-003-2:** Develop backend algorithms to compute delivery time estimates.
- **TASK-SYS-003-3:** Write tests for route calculation accuracy.
- **TASK-SYS-003-4:** Document the routing and estimation process.

### US-SYS-004: Push Notification System
- **TASK-SYS-004-1:** Implement a robust push notification service.
- **TASK-SYS-004-2:** Integrate notifications into the mobile and web apps.
- **TASK-SYS-004-3:** Write tests to simulate push events.
- **TASK-SYS-004-4:** Document notification configuration.

### US-SYS-005: Offline Mode and Data Caching
- **TASK-SYS-005-1:** Implement caching strategies for critical data.
- **TASK-SYS-005-2:** Develop offline access modes for key features.
- **TASK-SYS-005-3:** Write tests for offline functionality.
- **TASK-SYS-005-4:** Document the offline mode behavior and limitations.

### US-SYS-006: Robust Testing & Error Logging
- **TASK-SYS-006-1:** Integrate comprehensive)
- **TASK-CUS-019-1:** Extend the review module to allow reviews for both courier and merchant after order completion.
- **TASK-CUS-019-2:** Create backend endpoints to manage multi-party reviews.
- **TASK-CUS-019-3:** Write tests to ensure reviews are correctly linked to orders.
- **TASK-CUS-019-4:** Update documentation on multi-party review guidelines.

### US-CUS-020: System Performance Review (Customer)
- **TASK-CUS-020-1:** Implement a system performance review form in the post-order flow.
- **TASK-CUS-020-2:** Develop an endpoint to capture system feedback.
- **TASK-CUS-020-3:** Validate user inputs and store data.
- **TASK-CUS-020-4:** Write tests to verify feedback submission.
- **TASK-CUS-020-5:** Document how this feedback is used.

### US-CUS-021: Customer Support Access
- **TASK-CUS-021-1:** Build an in-app support or ticketing interface.
- **TASK-CUS-021-2:** Integrate support requests with a backend ticket management system.
- **TASK-CUS-021-3:** Implement notification updates for ticket status.
- **TASK-CUS-021-4:** Write tests to simulate support interactions.
- **TASK-CUS-021-5:** Update support documentation.

### US-CUS-022: Create a Package Delivery Order
- **TASK-CUS-022-1:** Design an order creation UI with flexible pickup and drop-off address fields.
- **TASK-CUS-022-2:** Update the backend order creation API to support addresses from anywhere.
- **TASK-CUS-022-3:** Enhance data models to store complete address details.
- **TASK-CUS-022-4:** Implement comprehensive input validations.
- **TASK-CUS-022-5:** Write integration tests for the flexible order process.
- **TASK-CUS-022-6:** Update FAQs and documentation to describe the package delivery order flow.

### US-CUS-023: Select Delivery Vehicle
- **TASK-CUS-023-1:** Add a dropdown/selection component for delivery vehicles in the order form.
- **TASK-CUS-023-2:** Update the backend to return allowed vehicle types (cars, bikes, walkers, etc.).
- **TASK-CUS-023-3:** Validate the selected vehicle type.
- **TASK-CUS-023-4:** Write tests for the delivery vehicle selection feature.
- **TASK-CUS-023-5:** Document the available vehicle options.

### US-BIL-001: Apply System Commission
- **TASK-BIL-001-1:** Implement backend logic to calculate a 10% commission on courier fees.
- **TASK-BIL-001-2:** Ensure the commission is applied automatically upon fee calculation.
- **TASK-BIL-001-3:** Write tests to verify proper commission calculation.
- **TASK-BIL-001-4:** Document the commission model.

### US-BIL-002: Calculate Courier & Waiting Fees
- **TASK-BIL-002-1:** Develop logic to use the courier’s bid value as the base fee.
- **TASK-BIL-002-2:** Integrate calculation for waiting fees starting after a 5-minute delay at pickup/drop-off.
- **TASK-BIL-002-3:** Validate fee calculations with test scenarios.
- **TASK-BIL-002-4:** Document the fee and waiting fee structure.

### US-URP-001: Block/Favourite Other Users
- **TASK-URP-001-1:** Extend user profile UI to include actions for adding/removing from favourite and block lists.
- **TASK-URP-001-2:** Update backend APIs to handle favourite/block list modifications.
- **TASK-URP-001-3:** Ensure the changes are reflected in user interactions in real time.
- **TASK-URP-001-4:** Write tests for the block/favourite functionality.
- **TASK-URP-001-5:** Update documentation with guidelines on user relationships.

## Merchant/Vendor Stories

### US-MER-001: Merchant Registration & Profile Setup
- **TASK-MER-001-1:** Design a merchant-specific registration UI.
- **TASK-MER-001-2:** Implement verification (document uploads) and profile creation endpoints.
- **TASK-MER-001-3:** Update the merchant profile model with location, contact, and operating hours.
- **TASK-MER-001-4:** Write tests for the onboarding flow.
- **TASK-MER-001-5:** Document the merchant registration process.

### US-MER-002: Menu Management
- **TASK-MER-002-1:** Design an intuitive UI for managing menu items.
- **TASK-MER-002-2:**