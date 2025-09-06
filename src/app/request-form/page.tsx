
import { useAuth } from "@/context/auth-context";
import type { Employee, LeaveRequest, LeaveRequestStatus, EmployeeWithCurrentContract } from "@/types"; 
import { collection, getDocs, addDoc, doc, updateDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { sendLeaveRequestSubmittedEmail } from "@/lib/email";
import { leaveTypes } from "@/lib/data";

export default function RequestForm(){

    const { toast } = useToast();
    const { currentUser, loading: authLoading } = useAuth();

    const addLeaveRequest = async (newRequestData: Omit<LeaveRequest, "id">) => {
        if (!currentUser) return;
        try {
            const docRef = await addDoc(collection(db, "leave-requests"), newRequestData);
            const newRequest = { id: docRef.id, ...newRequestData };
            //setLeaveRequests(prev => [...prev, newRequest]);
            toast({ title: "Request Submitted", description: "Your leave request has been submitted for approval." });
    
            // Email notification logic
            if (currentUser.supervisorId) {
                await sendLeaveRequestSubmittedEmail({
                    request: newRequest,
                    employee: currentUser,
                    leaveTypes: leaveTypes,
                });
            }
    
        } catch (error) {
            console.error("Error adding leave request: ", error);
            toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your leave request." });
        }
      };


    return <div>

        </div>
}
