
import { useAuth } from "@/context/auth-context";
import type { Employee, LeaveRequest, LeaveRequestStatus, EmployeeWithCurrentContract } from "@/types"; 
import { collection, getDocs, addDoc, doc, updateDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { sendLeaveRequestSubmittedEmail } from "@/lib/email";
import { leaveTypes } from "@/lib/data";
import { getEmployeeById } from "@/lib/employee";
import { LeaveRequestForm } from "@/components/leave-request-form";

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
                getEmployeeById(currentUser.supervisorId).then(supervisor => {
                    if (supervisor) {
                        sendLeaveRequestSubmittedEmail({
                            request: newRequest,
                            employee: currentUser,
                            leaveTypes: leaveTypes,
                        });
                    }
                })
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
            {
                currentUser && 
                <LeaveRequestForm 
                    currentUser={currentUser}
                    addLeaveRequest={addLeaveRequest}
                    leaveRequests={leaveRequests}
                />
            }
        </div>
}
