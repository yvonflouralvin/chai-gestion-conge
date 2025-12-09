
import type { LucideIcon } from "lucide-react";

export type EmployeeRole = "Employee" | "Supervisor" | "Manager" | "Admin" | "HR";
export type ContractType =
  | "Contrat-Staff"
  | "Contrat-Independant"
  | "Contract";

export type Contract = {
  title: string;
  team: string;
  contractType: ContractType;
  startDate: Date;
  endDate: Date | null;
};

export type Employee = {
  id: string ;
  name: string;
  email: string;
  avatar: string;
  supervisorId: string | null ;
  role: EmployeeRole;
  contracts: Contract[] | null;
  availableLeaveDays: number;
};

// Derived properties for convenience
export type EmployeeWithCurrentContract = Employee & {
  title:string;
  team: string;
  contractType: ContractType;
  contractStartDate: Date;
  contractEndDate: Date | null;
};

export type CircumstanceType = "Deuil" | "Mariage" | "Déménagement";

export type LeaveType = {
  id: number;
  name:string;
  icon: LucideIcon;
  subTypes?: CircumstanceType[];
};

export type LeaveRequestStatus =
  | "Pending Supervisor"
  | "Pending Manager"
  | "Pending HR"
  | "Approved"
  | "Rejected";

export type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveTypeId: number;
  circumstanceType?: CircumstanceType | null;
  startDate: Date;
  endDate: Date;
  status: LeaveRequestStatus;
  supervisorReason: string;
  managerReason: string;
  comment: string;
  submissionDate: Date;
  documentUrl?: string | null;
  supervisorId: string | null;
};

export type LeaveRequestHistoryEntry = {
  id: string;
  requestId: string;
  action: "submitted" | "approved" | "rejected" | "status_changed";
  status: LeaveRequestStatus;
  actorId: string;
  actorName: string;
  actorRole: EmployeeRole;
  timestamp: Date;
  comment?: string;
  reason?: string;
  previousStatus?: LeaveRequestStatus;
};
