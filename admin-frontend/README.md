# TradeX Admin Frontend

This is a separate React admin dashboard scaffold for internal platform management. It is isolated from the main user-facing frontend so existing customer and supplier flows remain untouched.

## Included

- Admin login flow using the shared JWT backend
- Protected admin routes
- Dashboard overview
- User management
- Inquiry management
- Product and listing management
- Conversation monitor
- Activity tracking

## Important note

This frontend is wired to the current backend API shape where possible. True admin-only endpoints should be added later for full production readiness.

## Run locally

```bash
cd admin-frontend
npm install
npm run dev
```

Default Vite port:

- `http://localhost:5174`
