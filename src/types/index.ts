import type { LucideIcon } from "lucide-react";

export type EmployeeRole = "Employee" | "Supervisor" | "Manager" | "Admin";
export type ContractType = "Full-time" | "Part-time" | "Contract";

export type Employee = {
  id: string;
  name: string;
  email: string;
  title: string;
  team: string;
  avatar: string;
  supervisorId: string | null;
  role: EmployeeRole;
  contractType: ContractType;
  contractStartDate: Date;
  contractEndDate: Date | null;
};

export type LeaveType = {
  id: number;
  name:string;
  icon: LucideIcon;
};

export type LeaveRequestStatus =
  | "Pending Supervisor"
  | "Pending Manager"
  | "Approved"
  | "Rejected";

export type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveTypeId: number;
  startDate: Date;
  endDate: Date;
  status: LeaveRequestStatus;
  supervisorReason: string;
  managerReason: string;
  submissionDate: Date;
};
