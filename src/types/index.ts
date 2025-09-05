
import type { LucideIcon } from "lucide-react";

export type EmployeeRole = "Employee" | "Supervisor" | "Manager" | "Admin";
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
  id: string;
  name: string;
  email: string;
  avatar: string;
  supervisorId: string | null;
  role: EmployeeRole;
  contracts: Contract[];
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
};

