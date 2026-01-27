export interface Service {
  serviceId?: number;
  serviceName: string;
  description?: string;
  price: number;
  unit: string; // Đơn vị: cái, chai, gói, v.v.
  status: ServiceStatus;
  courtGroupId: number; // Dịch vụ thuộc về cụm sân nào
  courtGroupName?: string; // Tên cụm sân (optional, for display)
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ServiceStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE'
}

export interface ServiceListRequest {
  courtGroupId?: number; // Filter theo cụm sân
  status?: ServiceStatus;
  search?: string;
}


