
import type { Employee, LeaveRequest, LeaveType } from "@/types";
import { Briefcase, Heart, Plane, Baby } from "lucide-react";

export const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Alice Johnson",
    title: "Software Engineer",
    team: "Product Development",
    avatar: "https://placehold.co/40x40.png",
    supervisorId: 2,
    role: "Employee",
    contractType: "Full-time",
    contractStartDate: new Date("2022-01-15"),
    contractEndDate: null,
    email: "alice@example.com",
  },
  {
    id: 2,
    name: "Bob Williams",
    title: "Engineering Manager",
    team: "Product Development",
    avatar: "https://placehold.co/40x40.png",
    supervisorId: 3,
    role: "Supervisor",
    contractType: "Full-time",
    contractStartDate: new Date("2020-03-01"),
    contractEndDate: null,
    email: "bob@example.com",
  },
  {
    id: 3,
    name: "Charlie Brown",
    title: "Director of Engineering",
    team: "Management",
    avatar: "https://placehold.co/40x40.png",
    supervisorId: null,
    role: "Manager",
    contractType: "Full-time",
    contractStartDate: new Date("2018-07-20"),
    contractEndDate: null,
    email: "charlie@example.com",
  },
    {
    id: 4,
    name: "Diana Prince",
    title: "HR Manager",
    team: "Human Resources",
    avatar: "https://placehold.co/40x40.png",
    supervisorId: 3,
    role: "Supervisor",
    contractType: "Full-time",
    contractStartDate: new Date("2021-09-01"),
    contractEndDate: null,
    email: "diana@example.com",
  },
  {
    id: 5,
    name: "Ethan Hunt",
    title: "Lead Designer",
    team: "Design",
    avatar: "https://placehold.co/40x40.png",
    supervisorId: 2,
    role: "Employee",
    contractType: "Contract",
    contractStartDate: new Date("2023-05-10"),
    contractEndDate: new Date("2024-11-10"),
    email: "ethan@example.com",
  }
];

export const leaveTypes: LeaveType[] = [
  { id: 1, name: "Annuel", icon: Plane },
  { id: 2, name: "Sick", icon: Heart },
  { id: 3, name: "Paternity", icon: Baby },
  { id: 4, name: "Circonstance (Deuil, mariage,déménagement)", icon: Briefcase },
];

// This is no longer used, data is fetched from firestore
export const initialLeaveRequests: LeaveRequest[] = [];
