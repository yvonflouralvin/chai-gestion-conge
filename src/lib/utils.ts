
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, isSunday, isSameDay, differenceInMonths, isWeekend } from 'date-fns';
import type { Employee, Contract, EmployeeWithCurrentContract, EmployeeRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A mock list of public holidays
const publicHolidays: Date[] = [
  new Date('2026-01-01'), // Nouvel an
  new Date('2026-01-04'), // Journee des martyrs de l'Independance
  new Date('2026-01-16'), // Journee du Heros National Laurent Desire Kabila
  new Date('2026-01-17'), // Journee du Heros National Patrice Emery Lumumba
  new Date('2026-04-06'), // Journee du Combat de Simon Kimbangu et de la conscience africaine
  new Date('2026-05-01'), // Fete du Travail
  new Date('2026-05-17'), // Journee des Forces Armees
  new Date('2026-06-30'), // Journee de l'Independance
  new Date('2026-08-01'), // Fete des Parents
  new Date('2026-12-25'), // Noel
];

// export function calculateLeaveDays(startDate: Date | undefined, endDate: Date | undefined): number {
//   if (!startDate || !endDate || endDate < startDate) {
//     return 0;
//   }

//   const interval = eachDayOfInterval({ start: startDate, end: endDate });

//   const workingDays = interval.filter(day => {
//     const isHoliday = publicHolidays.some(holiday => isSameDay(day, holiday));
//     return !isSunday(day) && !isHoliday;
//   });

//   return workingDays.length;
// }

export function calculateLeaveDays(
  startDate: Date | undefined,
  endDate: Date | undefined
): number {
  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  const interval = eachDayOfInterval({ start: startDate, end: endDate });

  const workingDays = interval.filter(day => {
    const isHoliday = publicHolidays.some(holiday => isSameDay(day, holiday));
    return !isWeekend(day) && !isHoliday;
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
      role: [] as EmployeeRole[], //docData.role as Employee['role'],
      contracts: contracts,
      availableLeaveDays: docData.availableLeaveDays || 0,
      contractEndDate: docData.contractEndDate || null,
      contractStartDate: docData.contractStartDate || null
    };

    if(typeof docData.role === 'string') {
      employee.role = [docData.role];
    } else {
      employee.role = docData.role;
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
