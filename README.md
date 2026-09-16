# RobeFlow — Quote & Customer Management

RobeFlow is a full-stack business workflow application created by **Saichand Muddasani** for wardrobe sales, quoting, invoicing, scheduling, dispatch, and warehouse pick lists.

## Current capabilities

- Customer records and duplicate-aware customer selection
- Quote creation, editing, revision history, PDF generation, and email delivery
- Product pricing, discounts, service charges, and design attachments
- Invoice and payment tracking
- Job board, site-measure and installation scheduling
- Dispatch workflow and freight tracking
- Consolidated I-Robe, cabinet, hardware, and accessory pick lists
- Role-oriented workspaces for Admin, Sales, Accounts, and Operations
- Dashboard reporting and CSV exports

## Project status

This repository is the source-control home for the RobeFlow portfolio project. The current application was prototyped with ChatGPT Sites. Migration work is underway for Vercel hosting, Supabase authentication and data storage, native password reset, and `robeflow.saimuddasani.com`.

## Local development

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and fill in your own values.
3. Run `npm install`.
4. Run `npm run dev`.

## Security

No customer database, uploaded drawings, passwords, API keys, administrator email, or production secrets are stored in this repository. Runtime configuration must be supplied through environment variables.

## Author

**Saichand Muddasani**  
[Portfolio](https://saimuddasani.com)
