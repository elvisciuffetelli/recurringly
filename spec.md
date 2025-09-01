# MySubscriptions App - Feature and Database Specification

## Overview

MySubscriptions is a personal recurring expenses management app. It allows users to track subscriptions, tax payments, installments (like Klarna or PayPal), and other fixed or recurring expenses. Users can view dashboards with totals, categorize their expenses, and track payment history.

---

## Tech Stack

* **Frontend:** Next.js 15 with App Router + React 19 + Tailwind CSS 4
* **Backend:** Next.js API Routes
* **Database:** MySQL 8.0 with Prisma ORM
* **Authentication:** NextAuth.js
* **UI Components:** shadcn/ui for React components
* **Optional:** Chart library (e.g., Recharts or Chart.js) for dashboard visualization

---

## Features

### 1. User Authentication

* **NextAuth.js** for authentication.
* Users can log in with email/password or OAuth (Google).
* Each user can only see their own subscriptions and payments.

### 2. Subscription / Recurring Expense Management

* Users can **create, read, update, and delete** subscriptions.
* Each subscription includes:

  * Name (string)
  * Type (enum: Subscription, Tax, Installment, Other)
  * Amount (decimal)
  * Currency (default: EUR)
  * Frequency (enum: Monthly, Yearly, Weekly, Quarterly, One-Time)
  * Start date
  * End date (optional)
  * Status (enum: Active, Cancelled, Expired)

### 3. Payment / Installment Management

* Each subscription can have multiple payments.
* Payment attributes:

  * Due date
  * Paid date (optional)
  * Amount
  * Status (enum: Pending, Paid, Overdue)
* Users can mark payments as paid.

### 4. Dashboard

* Displays total expenses per month and per year.
* Breakdown by category (Subscription, Tax, Installment, Other).
* Payment history and status overview.

### 5. Optional / Future Features

* Email or push notifications for upcoming payments.
* Multi-currency support with automatic conversion via API.
* Advanced analytics (monthly trends, average spend, etc.).

---

## Database Schema

**Stack:** MySQL 8.0 + Prisma ORM

### Tables

#### User

| Column   | Type   | Key    | Description     |
| -------- | ------ | ------ | --------------- |
| id       | String | PK     | Unique user ID  |
| email    | String | Unique | User email      |
| password | String |        | Hashed password |

#### Subscription

| Column | Type   | Key | Description                  |
| ------ | ------ | --- | ---------------------------- |
| id     | String | PK  | Unique subscription ID       |
| userId | String | FK  | References User(id)          |
| name   | String |     | Subscription name            |
| type   | Enum   |     | SubscriptionType (Subscripti |
