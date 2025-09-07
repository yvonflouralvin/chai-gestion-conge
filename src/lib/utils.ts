
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, isSunday, isSameDay, differenceInMonths } from 'date-fns';
import type { Employee, Contract, EmployeeWithCurrentContract } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A mock list of public holidays
const publicHolidays: Date[] = [
  new Date('2024-01-01'), // New Year's Day
  new Date('2024-07-04'), // Independence Day
  new Date('2024-12-25'), // Christmas Day
];

export function calculateLeaveDays(startDate: Date | undefined, endDate: Date | undefined): number {
  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  const interval = eachDayOfInterval({ start: startDate, end: endDate });

  const workingDays = interval.filter(day => {
    const isHoliday = publicHolidays.some(holiday => isSameDay(day, holiday));
    return !isSunday(day) && !isHoliday;
  });

  return workingDays.length;
}

export function calculateContractLeaveDays(contract: Contract): number {
    const today = new Date();
    const endDate = contract.endDate || today; // If no end date, calculate up to today
    const months = differenceInMonths(endDate, contract.startDate);
    return Math.floor((months > 0 ? months : 0) * 1.75);
}


export function getCurrentContract(employee: Employee | EmployeeWithCurrentContract): Contract | null {
    if (!employee.contracts || employee.contracts.length === 0) {
        return null;
    }
    // Sort contracts by start date in descending order to get the most recent one first
    const sortedContracts = [...employee.contracts].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    return sortedContracts[0];
}

export function getFirstContract(employee: Employee | EmployeeWithCurrentContract): Contract | null {
    if (!employee.contracts || employee.contracts.length === 0) {
        return null;
    }
    // Sort contracts by start date in ascending order to get the first one
    const sortedContracts = [...employee.contracts].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return sortedContracts[0];
}

export function processEmployee(docData: any, docId: string): EmployeeWithCurrentContract {
    const contracts = (docData.contracts || []).map((c: any) => ({
      ...c,
      startDate: c.startDate.toDate(),
      endDate: c.endDate ? c.endDate.toDate() : null,
    }));

    const employee: Employee = {
        id: docId,
        name: docData.name,
        email: docData.email,
        avatar: docData.avatar || `https://placehold.co/40x40.png`,
        supervisorId: docData.supervisorId,
        role: docData.role as Employee['role'],
        contracts: contracts,
        availableLeaveDays: docData.availableLeaveDays || 0,
    }

    const currentContract = getCurrentContract(employee);

    return {
        ...employee,
        title: currentContract?.title || "N/A",
        team: currentContract?.team || "N/A",
        contractType: currentContract?.contractType || "Contrat-Staff",
        contractStartDate: currentContract?.startDate || new Date(),
        contractEndDate: currentContract?.endDate || null,
    };
}
