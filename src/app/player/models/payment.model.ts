import { Booking } from './booking.model';

export interface Payment {
  paymentId: number;
  bookingId: number;
  booking?: Booking;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOMO = 'MOMO',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface PaymentRequest {
  bookingId: number;
  paymentMethod: PaymentMethod;
  amount: number;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  paymentId: number;
  paymentUrl?: string;
  transactionId?: string;
  status: PaymentStatus;
  message?: string;
}

export interface PaymentVerificationRequest {
  transactionId: string;
  paymentId: number;
}




