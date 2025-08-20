
import type { LucideIcon } from "lucide-react";

export type EmployeeRole = "Employee" | "Supervisor" | "Manager";
export type ContractType = "Full-time" | "Part-time" | "Contract";

export type Employee = {
  id: number;
  name: string;
  title: string;
  team: string;
  avatar: string;
  supervisorId: number | null;
  role: EmployeeRole;
  contractType: ContractType;
  contractStartDate: Date;
  contractEndDate: Date | null;
};

export type LeaveType = {
  id: number;
  name: string;
  icon: LucideIcon;
};

export type LeaveRequestStatus =
  | "Pending Supervisor"
  | "Pending Manager"
  | "Approved"
  | "Rejected";

export type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: Date;
  endDate: Date;
  status: LeaveRequestStatus;
  supervisorReason: string;
  managerReason: string;
  approver?: string;
};
