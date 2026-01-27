export interface User {
  userId?: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role?: UserRole;
  avatar?: string;
  status?: 'ACTIVE' | 'LOCKED';
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  COURT_MANAGER = 'COURT_MANAGER',
  ADMIN = 'ADMIN'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  // Note: confirmPassword chỉ dùng để validate ở form level, không gửi lên backend
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
  avatar?: string;
}

