# Oil Painting

Standalone extraction of the painting-order feature from the larger Next.js app.

## Included

- Public intake page at `/painting-order`
- Upload and style-conversion studio at `/painting-order/upload`
- Stripe checkout flow
- Gallery page backed by Prisma
- Success page that reconciles Stripe payment status
- Painting-related API routes

## Setup

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env` and fill in Stripe and Cloudinary keys
3. Generate Prisma client with `npm run db:generate`
4. Create the local SQLite database with `npm run db:push`
5. Start the app with `npm run dev`

## Notes

- The style-transfer backend remains external and defaults to `https://linahuo189.pythonanywhere.com`
- Checkout, upload, and gallery persistence require valid environment variables
