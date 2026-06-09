'use client';

import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LeaveRequestHistoryEntry, LeaveRequestStatus, EmployeeRole, LeaveRequest } from "@/types";
import { leaveTypes } from "./data";

/**
 * Enregistre un événement dans l'historique d'une demande de congé
 */
export async function addLeaveRequestHistoryEntry(
  requestId: string,
  action: "submitted" | "approved" | "rejected" | "status_changed",
  status: LeaveRequestStatus,
  actorId: string,
  actorName: string,
  actorRole: EmployeeRole[],
  options?: {
    comment?: string;
    reason?: string;
    previousStatus?: LeaveRequestStatus;
  }
): Promise<void> {
  try {
    const historyCollection = collection(db, "leave-requests", requestId, "history");
    await addDoc(historyCollection, {
      requestId,
      action,
      status,
      actorId,
      actorName,
      actorRole,
      timestamp: Timestamp.now(),
      comment: options?.comment || null,
      reason: options?.reason || null,
      previousStatus: options?.previousStatus || null,
    });
  } catch (error) {
    console.error("Error adding history entry:", error);
    throw error;
  }
}

/**
 * Récupère l'historique complet d'une demande de congé
 */
export async function getLeaveRequestHistory(requestId: string): Promise<LeaveRequestHistoryEntry[]> {
  try {
    const historyCollection = collection(db, "leave-requests", requestId, "history");
    const q = query(historyCollection, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        requestId: data.requestId,
        action: data.action,
        status: data.status as LeaveRequestStatus,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole as EmployeeRole,
        timestamp: data.timestamp.toDate(),
        comment: data.comment || undefined,
        reason: data.reason || undefined,
        previousStatus: data.previousStatus as LeaveRequestStatus | undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}


export const getLeaveTypeName = (request: LeaveRequest) => {
    const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
    if (!leaveType) return 'Unknown';
    if (leaveType.id === 4 && request.circumstanceType) { // Circumstance Leave
        return `${leaveType.name} (${request.circumstanceType})`;
    }
    return leaveType.name;
};


type DateInput = string | Date;

export function getWorkingDays(
  startDate: DateInput,
  endDate: DateInput,
  inclusive = true
) {

  const holidays: DateInput[] = [];
const extraDaysOff: DateInput[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Normalisation des jours fériés et exclusions
  const holidaySet = new Set(
    holidays.map(d => new Date(d).toDateString())
  );

  const excludedSet = new Set(
    extraDaysOff.map(d => new Date(d).toDateString())
  );

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    const isWeekend = day === 0 || day === 6;

    const key = current.toDateString();

    const isHoliday = holidaySet.has(key);
    const isExcluded = excludedSet.has(key);

    if (!isWeekend && !isHoliday && !isExcluded) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return inclusive ? count : Math.max(0, count - 1);
}