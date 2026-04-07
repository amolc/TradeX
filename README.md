# TradeX Asia

TradeX Asia is a full-stack B2B marketplace prototype for buyers and suppliers.  
It combines a Django REST backend with a React + Vite frontend and supports product discovery, enquiries, orders, chat-based negotiation, shipment tracking, and logistics inquiry handling.

## Tech Stack

### Backend

- Django
- Django REST Framework
- PostgreSQL
- `django-cors-headers`
- `djangorestframework-simplejwt`

### Frontend

- React
- React Router
- Axios
- Vite

### Admin Frontend

- React
- React Router
- Axios
- Vite

## Project Structure

- `backend/`
  - `users/` buyer and supplier marketplace profiles
  - `products/` supplier product listings
  - `orders/` order flow, enquiries, conversations, chat, offers
  - `logistics/` shipment tracking and logistics inquiries
- `frontend/`
  - role-based buyer and supplier dashboards
  - marketplace, orders, logistics, and chat pages
- `admin-frontend/`
  - separate internal admin dashboard frontend
  - admin login, protected routes, overview, user management, inquiries, chat monitor, activity tracking

## Current Features

### Authentication and Roles

- User registration for `buyer` and `supplier`
- JWT login and refresh endpoints
- Role-aware frontend dashboards

### Marketplace

- Suppliers can create product listings
- Buyers can browse marketplace products
- Product detail page supports placing orders and sending enquiries

### Enquiry -> Chat -> Offer -> Order Flow

- Buyer enquiry creates or reuses a shared conversation for:
  - buyer
  - supplier
  - product
- Initial enquiry message is automatically stored in the conversation
- Buyer and supplier can continue messaging in the same chat thread
- Suppliers can send structured offers with:
  - unit price
  - quantity
  - delivery days
- Buyers can accept an offer and create an order linked to:
  - the conversation
  - the accepted offer message

### Orders and Requests

- Buyers can create:
  - enquiries
  - orders
- Suppliers can:
  - respond to enquiries
  - confirm orders
- Orders include:
  - quantity
  - unit price
  - total amount
  - shipping mode
  - supplier response

### Logistics Tracking

- Logistics records are created automatically for orders
- Suppliers can update shipment tracking details:
  - tracking stage
  - shipment status
  - location
- Buyers and suppliers can view logistics progress through the dashboard flow

### Logistics Inquiry Flow

- Buyer-side logistics page supports:
  - service cards
  - service details
  - quote request form
- Logistics inquiry stores:
  - full name
  - email
  - service type
  - cargo type
  - origin
  - destination
  - quantity
  - weight
  - optional notes
- Supplier-side logistics page shows incoming logistics inquiries
- Supplier can contact the buyer through:
  - email
  - Telegram link

### Admin Frontend Overview

- A separate React admin panel is available for internal platform management
- It is isolated from the customer-facing frontend and uses the same Django backend APIs
- Current admin pages include:
  - dashboard overview
  - user management
  - inquiry management
  - product/listing review
  - conversation monitor
  - activity tracking
- Admin access currently expects a Django auth account with:
  - `is_staff = True`
  - or `is_superuser = True`

## Main Frontend Pages

- `/dashboard`
- `/products`
- `/products/:productId`
- `/orders`
- `/logistics`
- `/conversations`
- `/conversations/:id`

## Main API Routes

### Auth and Users

- `POST /api/token/`
- `POST /api/token/refresh/`
- `GET|POST /api/users/`

### Products

- `GET|POST /api/products/`

### Orders

- `GET|POST /api/orders/`
- `POST /api/orders/{id}/supplier_action/`
- `GET /api/orders/analytics/`

### Conversations and Messages

- `GET|POST /api/conversations/`
- `GET|POST /api/conversations/{id}/messages/`
- `POST /api/messages/accept-offer/`

### Logistics

- `GET|POST /api/logistics/`
- `PATCH /api/logistics/{id}/`
- `GET|POST /api/logistics-inquiry/`

## Local Setup

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at:

- `http://127.0.0.1:8000/`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at:

- `http://127.0.0.1:5173/`

The frontend is configured to call:

- `http://127.0.0.1:8000/api/`

### Admin Frontend

```powershell
cd admin-frontend
npm install
npm run dev
```

Admin frontend runs at:

- `http://127.0.0.1:5174/`

Folder location:

- `admin-frontend/`

## Important Notes

- The project currently uses Django auth users for login and a separate `users.User` profile model for marketplace role data.
- Some temporary local-testing fallbacks may still exist in backend view logic to support unauthenticated development flows.
- If you add the new logistics inquiry fields to a fresh environment, make sure migrations are applied.

## Recommended Commands

### Backend validation

```powershell
cd backend
python manage.py check
```

### Frontend build verification

```powershell
cd frontend
npm run build
```

## Recent Functional Additions

- Shared conversation-based enquiry system
- Chat page for buyer/supplier negotiation
- Offer sending and offer acceptance flow
- Conversation-linked order creation
- Logistics inquiry page for buyers
- Supplier inquiry review view in logistics section
.