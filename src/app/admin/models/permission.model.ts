import { User } from '../../player/models/user.model';
import { CourtGroup } from '../../player/models/court.model';

/**
 * Phân quyền: Gán Cụm sân cho Quản lý sân
 */
export interface ManagerAssignment {
  assignmentId?: number;
  managerId: number;
  manager?: User; // Thông tin quản lý
  courtGroupId: number;
  courtGroup?: CourtGroup; // Thông tin cụm sân
  assignedAt?: Date;
  assignedBy?: number; // ID của Admin gán
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Request để gán cụm sân cho quản lý
 */
export interface AssignCourtGroupsRequest {
  managerId: number;
  courtGroupIds: number[]; // Danh sách ID cụm sân
}

/**
 * Response khi lấy danh sách cụm sân của một quản lý
 */
export interface ManagerCourtGroupsResponse {
  manager: User;
  assignedCourtGroups: CourtGroup[];
  availableCourtGroups: CourtGroup[]; // Các cụm sân chưa được gán
}



