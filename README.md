This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Automatic Emails (Resend)

Registration submissions now trigger automatic emails from `app/api/register/route.ts`:

- Confirmation email to the team's `contact_email`
- Internal notification email for new registrations
- Contact page submissions (`/contact`) trigger automatic emails from `app/api/contact/route.ts`

Set these variables in your `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL="Granpanpan Nations Cup <notifications@granpanpannationscup.com>"
RESEND_NOTIFICATION_EMAIL=info@granpanpannationscup.com
RESEND_REPLY_TO_EMAIL=info@granpanpannationscup.com
CONTACT_NOTIFICATION_EMAIL=info@granpanpannationscup.com
```

Notes:

- If `RESEND_API_KEY` is missing, registration still works and emails are skipped.
- `RESEND_NOTIFICATION_EMAIL` supports multiple recipients separated by commas.
- `CONTACT_NOTIFICATION_EMAIL` overrides contact-form recipient(s). It also supports comma-separated recipients.
