
'use server';

import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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

/**
 * Retrieves all employees with a specific role from Firestore.
 * @param role The role to filter employees by.
 * @returns A promise that resolves to an array of processed employee data, or an empty array if none are found or an error occurs.
 */
export async function getEmployeesByRole(role: string): Promise<EmployeeWithCurrentContract[]> {
    if (!role) {
        console.error("getEmployeesByRole called with no role.");
        return [];
    }

    try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('role', '==', role));
        const querySnapshot = await getDocs(q);

        const employees: EmployeeWithCurrentContract[] = querySnapshot.docs.map(doc => processEmployee(doc.data(), doc.id));
        return employees;
    } catch (error) {
        console.error(`Error fetching employees with role ${role}:`, error);
        return [];
    }
}

/**
 * Retrieve Manager from Firestore.
 * @param role The role to filter employees by.
 * @returns A promise that resolves to an array of processed employee data, or an empty array if none are found or an error occurs.
 */
export async function getManager(): Promise<EmployeeWithCurrentContract|null> {
 
    try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('role', '==', 'Manager'));
        const querySnapshot = await getDocs(q);

        const employees: EmployeeWithCurrentContract[] = querySnapshot.docs.map(doc => processEmployee(doc.data(), doc.id));
        return employees[0];
    } catch (error) {
        console.error(`Error fetching employees with role Manager:`, error);
        return null;
    }
}