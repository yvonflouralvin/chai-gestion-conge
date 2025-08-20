
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { collection, getDocs, addDoc, doc, updateDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Header } from "@/components/header";
import { LeaveRequestForm } from "@/components/leave-request-form";
import { LeaveHistory } from "@/components/leave-history";
import { AdminPanel } from "@/components/admin-panel";
import { leaveTypes } from "@/lib/data";
import type { Employee, LeaveRequest, LeaveRequestStatus } from "@/types";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch Employees
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData: Employee[] = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          title: data.title,
          team: data.team,
          avatar: data.avatar || `https://placehold.co/40x40.png`,
          supervisorId: data.supervisorId,
          role: data.role as Employee['role'],
          contractType: data.contractType as Employee['contractType'],
          contractStartDate: data.contractStartDate.toDate(),
          contractEndDate: data.contractEndDate ? data.contractEndDate.toDate() : null,
        };
      });
      setEmployees(usersData);

      // Fetch Leave Requests
      const requestsSnapshot = await getDocs(collection(db, "leave-requests"));
      const requestsData: LeaveRequest[] = requestsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          status: data.status as LeaveRequestStatus,
          supervisorReason: data.supervisorReason,
          managerReason: data.managerReason,
          submissionDate: data.submissionDate ? data.submissionDate.toDate() : data.startDate.toDate(),
        };
      });
      setLeaveRequests(requestsData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load data from the database." });
    }
    setLoading(false);
  };
  
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/signin');
    } else if (currentUser) {
        fetchAllData();
    }
  }, [currentUser, authLoading, router]);

  const addLeaveRequest = async (newRequestData: Omit<LeaveRequest, "id">) => {
    try {
        const docRef = await addDoc(collection(db, "leave-requests"), newRequestData);
        setLeaveRequests(prev => [...prev, { id: docRef.id, ...newRequestData }]);
        toast({ title: "Request Submitted", description: "Your leave request has been submitted for approval." });
    } catch (error) {
        console.error("Error adding leave request: ", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your leave request." });
    }
  };
  
  const updateRequestStatus = async (
    requestId: string,
    status: LeaveRequestStatus,
    reason?: string
  ) => {
    if (!currentUser) return;
    try {
        const requestRef = doc(db, "leave-requests", requestId);
        const updateData: any = { status };

        if (reason && status === 'Rejected') {
           if (currentUser.role === 'Supervisor') {
            updateData.supervisorReason = reason;
           } else if (currentUser.role === 'Manager') {
            updateData.managerReason = reason;
           }
        }

        await updateDoc(requestRef, updateData);
        
        setLeaveRequests(prev =>
            prev.map(req => req.id === requestId ? { ...req, ...updateData } : req)
        );
        toast({ title: "Request Updated", description: "The leave request status has been updated." });

    } catch (error) {
        console.error("Error updating request status: ", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the request status." });
    }
  };

  if (authLoading || loading || !currentUser) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header currentUser={currentUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {currentUser.role === 'Admin' ? 
          (
            <Tabs defaultValue="employees">
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger value="employees">Employee Management</TabsTrigger>
                  <TabsTrigger value="requests">Leave Requests</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="employees" className="mt-4">
                <AdminPanel leaveRequests={leaveRequests} />
              </TabsContent>
              <TabsContent value="requests" className="mt-4">
                <LeaveHistory 
                  requests={leaveRequests}
                  employees={employees}
                  leaveTypes={leaveTypes}
                  currentUser={currentUser} 
                  updateRequestStatus={updateRequestStatus}
                />
              </TabsContent>
            </Tabs>
        ) : (
            <Tabs defaultValue="request">
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger value="request">New Request</TabsTrigger>
                  <TabsTrigger value="history">History & Approvals</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="request" className="mt-4">
                <LeaveRequestForm 
                    leaveTypes={leaveTypes} 
                    currentUser={currentUser}
                    addLeaveRequest={addLeaveRequest}
                    leaveRequests={leaveRequests}
                  />
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                 <LeaveHistory 
                    requests={leaveRequests}
                    employees={employees}
                    leaveTypes={leaveTypes}
                    currentUser={currentUser} 
                    updateRequestStatus={updateRequestStatus}
                  />
              </TabsContent>
            </Tabs>
        )}
      </main>
    </div>
  );
}


