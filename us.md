# Complete Combined User Stories for Badr Delivery Platform

## Customer/User Stories

### User Registration & Profile Management
- **US-CUS-001: Registration**  
  *As a new customer, I want to sign up using my email or phone with OTP verification so that my account is secure.*

- **US-CUS-002: Profile Updates**  
  *As a customer, I want to update my personal details (address, payment method, etc.) so that my account remains current.*

### Browsing, Ordering & Payment
- **US-CUS-003: Store & Menu Exploration**  
  *As a customer, I want to browse nearby restaurants and vendors with menus and ratings so that I can choose the best option.*

- **US-CUS-004: Search & Filter**  
  *As a customer, I want to search and filter vendors by cuisine, rating, or promotions so that I can quickly find what I crave.*

- **US-CUS-005: Order Customization & Placement**  
  *As a customer, I want to add, customize, and place orders seamlessly to get exactly what I want.*

- **US-CUS-006: Upfront Payment Option**  
  *As a customer, I want to specify an upfront payment for an order so that only eligible couriers can view/bid on it.*

- **US-CUS-007: Specify Number of Couriers**  
  *As a customer, I want to indicate how many couriers are needed for my order to ensure proper manpower for large deliveries.*

- **US-CUS-008: Maximum Pick Distance**  
  *As a customer, I want to set a maximum pick-up distance so that only couriers within a certain range are considered.*

- **US-CUS-009: Multi-Payment Options**  
  *As a customer, I want to choose from several payment options (credit card, mobile wallet, COD) for flexibility.*

- **US-CUS-010: Secure Transaction**  
  *As a customer, I want an extra OTP authentication step during payment for added security.*

- **US-CUS-011: Order Confirmation**  
  *As a customer, I want a clear order confirmation with estimated delivery time so that I know my order is placed.*

- **US-CUS-012: Complete Address Details**  
  *As a customer, I want to provide detailed pickup and drop-off addresses (area, street, building, floor, apartment, contact name, phone) so that couriers have accurate instructions.*

- **US-CUS-013: View Courier Profile on Bid**  
  *As a customer, when receiving bids, I want to view the courier’s profile (completed orders, km/waiting rates, reviews, earnings, join date) and add them to my favourite or block list.*

- **US-CUS-014: Real-Time Tracking**  
  *As a customer, I want to track my order’s progress in real time so that I’m updated from acceptance to delivery.*

- **US-CUS-015: Accurate Delivery Time Estimation**  
  *As a customer, I want my order’s estimated delivery time to be based on the fastest route so that my expectations are realistic.*

- **US-CUS-016: Push & In-App Notifications**  
  *As a customer, I want timely notifications (order updates, delays, promotions) so that I stay informed.*

- **US-CUS-017: Order History & Reordering**  
  *As a customer, I want to view previous orders and quickly re-order my favorites to save time in future transactions.*

- **US-CUS-018: Rating & Feedback on Service (Customer)**  
  *As a customer, I want to rate my delivery experience with stars and comments so that I can help improve service quality.*

- **US-CUS-019: Review of Other Participants (Customer)**  
  *As a customer, after order completion, I want to review the courier and merchant so that my feedback helps improve their service.*

- **US-CUS-020: System Performance Review (Customer)**  
  *As a customer, after order completion, I want to rate the platform’s performance (ease of use, reliability, notifications) so that my feedback guides enhancements.*

- **US-CUS-021: Customer Support Access**  
  *As a customer, I want an in-app support channel to resolve order-related issues efficiently.*

- **US-CUS-022: Create a Package Delivery Order**  
  *As a customer, I want to create an order for picking up a package from anywhere and delivering it anywhere for full flexibility.*

- **US-CUS-023: Select Delivery Vehicle**  
  *As a customer, I want to select a delivery vehicle (including walkers) during order creation so that I choose the most appropriate option.*

### Billing & Fee Calculation
- **US-BIL-001: Apply System Commission**  
  *As the system, automatically calculate an additional 10% commission on courier fees to capture platform revenue.*

- **US-BIL-002: Calculate Courier Fees and Waiting Fees**  
  *As the system, compute courier fees based on bid price and add waiting fees (starting after a 5-minute delay at pickup/drop-off) so that delays are charged fairly.*

### User Relationships & Preferences
- **US-URP-001: Block/Favourite Other Users**  
  *As a user, I want to mark other users (courier, customer, merchant) as favourite or block them to tailor my interactions.*

## Merchant/Vendor Stories

- **US-MER-001: Merchant Registration & Profile Setup**  
  *As a merchant, I want to register, verify, and create a store profile (with location, contact info, hours) for customer trust.*

- **US-MER-002: Menu Management**  
  *As a merchant, I want to add, update, or remove menu items so that I can manage seasonal or current offerings efficiently.*

- **US-MER-003: Order Reception & Status Updates (Merchant)**  
  *As a merchant, I want to receive real-time order alerts and update order statuses (preparing, ready, dispatched) so that all parties remain synchronized.*

- **US-MER-004: Promotion & Discount Management**  
  *As a merchant, I want to create and manage promotions and discounts to attract new customers and reward loyal ones.*

- **US-MER-005: Performance Metrics (Merchant)**  
  *As a merchant, I want access to reports detailing sales, customer feedback, and order volume so that I can optimize operations.*

- **US-MER-006: Review of Other Participants (Merchant)**  
  *As a merchant, after order completion, I want to review the courier and customer to help improve service quality.*

- **US-MER-007: System Performance Review (Merchant)**  
  *As a merchant, I want to rate the platform’s performance after order completion so that my suggestions drive enhancements.*

## Courier/Delivery Agent Stories

- **US-COU-001: Courier Registration**  
  *As a courier, I want to register and verify my credentials to begin receiving delivery tasks.*

- **US-COU-002: Set Availability Status**  
  *As a courier, I want to toggle my online/offline status so that I control my availability for orders.*

- **US-COU-003: Set Fee per Kilometer**  
  *As a courier, I want to specify my own fee per kilometer so that my earnings reflect my operating costs.*

- **US-COU-004: Set Waiting Fee per Hour**  
  *As a courier, I want to set a waiting fee per hour so that I’m compensated during idle times at pickup or drop-off.*

- **US-COU-005: Available Budget Filter**  
  *As a courier, I want to set an available budget so that only orders within my cost constraints are shown.*

- **US-COU-006: View Customer Profile on Published Orders**  
  *As a courier, I want to view a customer’s profile (total spent, completed orders, reviews, join date) and be able to favourite or block them to inform my bidding decisions.*

- **US-COU-007: Block Areas (Geo-Filtering)**  
  *As a courier, I want to define areas on the map where orders are blocked so that orders in those regions are not shown to me.*

- **US-COU-008: Order Notifications & Details (Courier)**  
  *As a courier, I want to receive detailed notifications for new orders so that I can quickly decide whether to accept them.*

- **US-COU-009: Fastest Route Calculation (Courier)**  
  *As a courier, I want the system to calculate the fastest delivery route based on current traffic so that I can optimize my schedule.*

- **US-COU-010: Submit Order Bids**  
  *As a courier, I want to bid on published orders with my fee and waiting charges so that my offer reflects my cost model.*

- **US-COU-011: Order Status Updates (Courier)**  
  *As a courier, I want to update the order status (e.g., picked up, delivered) in real time so that all parties remain informed.*

- **US-COU-012: Earnings Dashboard**  
  *As a courier, I want to view my completed orders and earnings so that I can track my performance and income over time.*

- **US-COU-013: Rating & Feedback on Service (Courier)**  
  *As a courier, I want to see customer feedback and ratings so that I can continuously improve my service.*

- **US-COU-014: Review of Other Participants (Courier)**  
  *As a courier, after order completion, I want to review the customer and merchant with stars and comments so that constructive feedback is shared.*

- **US-COU-015: System Performance Review (Courier)**  
  *As a courier, after order completion, I want to provide feedback on key platform functions so that my input helps improve the system.*

- **US-COU-020: Pickup PIN Verification**  
  *As a courier, at pickup I want to be supplied with a pickup PIN that I can provide to the person handing over the package for identity confirmation.*

- **US-COU-021: Drop-off PIN Verification**  
  *As a courier, at drop-off I want to verify that the recipient provides the correct drop-off PIN so that delivery is confirmed.*

- **US-COU-022: Request Additional Couriers**  
  *As a courier, if a package exceeds my capacity, I want to request additional couriers so that the order can be completed safely.*

- **US-COU-023: Primary Courier Selection Logic**  
  *When an order has multiple couriers, I want the system to select a primary courier automatically based on a performance weight (using metrics such as completed orders, average rating, and on-time delivery percentage).*

## Administrator/Platform Manager Stories

- **US-ADM-001: Admin Dashboard**  
  *As an administrator, I want a comprehensive dashboard that aggregates order volumes, user activities, and system performance to easily monitor platform health.*

- **US-ADM-002: User & Account Management**  
  *As an administrator, I want to approve, suspend, or remove customer, courier, and merchant accounts so that the platform remains secure and reliable.*

- **US-ADM-003: Order and Dispute Management**  
  *As an administrator, I want to monitor active orders, manage disputes, and process cancellations or refunds so that service quality is maintained.*

- **US-ADM-004: Reporting & Analytics**  
  *As an administrator, I want to generate detailed reports on delivery times, ratings, and system performance so that I can identify areas for improvement.*

- **US-ADM-005: Security Settings & Audit Logs**  
  *As an administrator, I want to configure security settings and view audit logs so that the platform complies with data protection standards.*

- **US-ADM-006: Aggregated Review Analytics for Administrators**  
  *As an administrator, I want access to aggregated review data from all participants so that I can identify trends and address issues proactively.*

## System/Operational & Development Stories

- **US-SYS-001: Microservices Architecture**  
  *As a system architect or developer, I want the platform built on a scalable microservices framework so that it can smoothly handle peak loads and future expansion.*

- **US-SYS-002: API Documentation & Integration**  
  *As a developer, I want well-documented API endpoints for all platform functions so that internal and third-party integrations are streamlined.*

- **US-SYS-003: Calculation of Fastest Routes (System)**  
  *As the system, I want to calculate delivery routes using the fastest algorithm so that delivery time estimates and courier routing are optimized.*

- **US-SYS-004: Push Notification System**  
  *As the system, I want to push real-time notifications to users and couriers when key order events occur so that everyone is informed immediately.*

- **US-SYS-005: Offline Mode and Data Caching**  
  *As a user, I want critical data to be cached so that I have access to order history and menus even when connectivity is intermittent.*

- **US-SYS-006: Robust Testing & Error Logging**  
  *As a developer, I want integrated testing and error logging tools so that any issues are quickly identified and resolved for a stable live experience.*

- **US-SYS-007: System Health Dashboard**  
  *As a system maintenance engineer, I want to continuously monitor application performance and server health so that proactive maintenance can be performed.*

## Post-Order Reviews & Performance Feedback

- **US-PO-001: Mutual Reviews for Participants**  
  *As a participant (customer, courier, or merchant), after order completion, I want to submit a star rating and detailed review for each other party so that constructive feedback is provided.*

- **US-PO-002: Review of System Performance (Platform)**  
  *As a participant, after each order, I want to rate the overall platform performance (ease-of-use, responsiveness, reliability) so that my feedback contributes to continuous improvement.*

- **US-PO-003: Aggregated Review Analytics (Platform)**  
  *As an administrator, I want to access aggregated review and rating data across the platform so that I can monitor overall trends and service quality.*