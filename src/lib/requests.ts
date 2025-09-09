
'use server';

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LeaveRequest, LeaveRequestStatus } from "@/types";

/**
 * Retrieves all leave requests for a specific employee.
 * @param employeeId The UID of the employee whose requests to fetch.
 * @returns A promise that resolves to an array of leave requests.
 */
export async function getLeaveRequestsByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    if (!employeeId) {
        console.error("getLeaveRequestsByEmployeeId called with no ID.");
        return [];
    }

    try {
        const requestsCollection = collection(db, 'leave-requests');
        const q = query(requestsCollection, where("employeeId", "==", employeeId));
        const querySnapshot = await getDocs(q);

        const leaveRequests: LeaveRequest[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                employeeId: data.employeeId,
                leaveTypeId: data.leaveTypeId,
                circumstanceType: data.circumstanceType,
                startDate: data.startDate.toDate(),
                endDate: data.endDate.toDate(),
                status: data.status as LeaveRequestStatus,
                supervisorReason: data.supervisorReason,
                managerReason: data.managerReason,
                comment: data.comment,
                submissionDate: data.submissionDate ? data.submissionDate.toDate() : data.startDate.toDate(),
                documentUrl: data.documentUrl
            };
        });

        return leaveRequests;
    } catch (error) {
        console.error(`Error fetching leave requests for employee ID ${employeeId}:`, error);
        return [];
    }
}
