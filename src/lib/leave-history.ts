'use client';

import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LeaveRequestHistoryEntry, LeaveRequestStatus, EmployeeRole } from "@/types";

/**
 * Enregistre un événement dans l'historique d'une demande de congé
 */
export async function addLeaveRequestHistoryEntry(
  requestId: string,
  action: "submitted" | "approved" | "rejected" | "status_changed",
  status: LeaveRequestStatus,
  actorId: string,
  actorName: string,
  actorRole: EmployeeRole,
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

