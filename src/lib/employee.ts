
'use server';

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processEmployee } from "@/lib/utils";
import type { EmployeeWithCurrentContract } from "@/types";

/**
 * Retrieves a single employee's processed data from Firestore by their ID.
 * @param employeeId The UID of the employee to fetch.
 * @returns A promise that resolves to the processed employee data, or null if not found.
 */
export async function getEmployeeById(employeeId: string): Promise<EmployeeWithCurrentContract | null> {
    if (!employeeId) {
        console.error("getEmployeeById called with no ID.");
        return null;
    }
    
    try {
        const userDocRef = doc(db, 'users', employeeId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return processEmployee(userDoc.data(), userDoc.id);
        } else {
            console.warn(`No employee found with ID: ${employeeId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching employee with ID ${employeeId}:`, error);
        return null;
    }
}
