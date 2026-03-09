export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Inactive';
  avatar: string;
  joinedDate: string; 
}

export interface Sale {
  id: string;
  productName: string;
  amount: number;
  currency: string;
  date: string; 
  customerName: string;
  status: 'Completed' | 'Pending' | 'Refunded';
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export type Plan = 'Free' | 'Pro' | 'Enterprise'

export type SubscriptionStatus = 'active' | 'canceled'

export interface Subscription {
  plan: Plan
  status: SubscriptionStatus
  startDate: string
  endDate: string
}

export type InvoiceStatus = 'paid' | 'pending' | 'failed'

export interface Invoice {
  id: string
  amount: number
  currency: string
  date: string
  status: InvoiceStatus
  description: string
}