
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Header } from "@/components/header";
import { LeaveRequestForm } from "@/components/leave-request-form";
import { LeaveHistory } from "@/components/leave-history";
import { AdminPanel } from "@/components/admin-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initialEmployees, leaveTypes, initialLeaveRequests } from "@/lib/data";
import type { Employee, LeaveRequest, LeaveRequestStatus } from "@/types";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth/signin');
    }
  }, [currentUser, loading, router]);
  
  if (loading || !currentUser) {
    return null; // Or a loading spinner
  }

  const addLeaveRequest = (newRequestData: Omit<LeaveRequest, "id">) => {
    setLeaveRequests(prev => [
      ...prev,
      {
        id: (prev.length > 0 ? Math.max(...prev.map(r => r.id)) : 0) + 1,
        ...newRequestData,
      },
    ]);
  };
  
  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    const newEmployees = employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp);
    setEmployees(newEmployees);
  };

  const updateRequestStatus = (
    requestId: number,
    status: LeaveRequestStatus,
    reason?: string
  ) => {
    setLeaveRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          const updatedReq = { ...req, status };
          if (reason) {
            if (currentUser.role === 'Supervisor') updatedReq.supervisorReason = reason;
            if (currentUser.role === 'Manager') updatedReq.managerReason = reason;
          }
          return updatedReq;
        }
        return req;
      })
    );
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header currentUser={currentUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {currentUser.role === 'Manager' ? 
          (
          <Tabs defaultValue="leave-management" className="w-full">
            <div className="flex items-center">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="leave-management">Gestion de congé</TabsTrigger>
                    <TabsTrigger value="admin-panel">Admin Panel</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="leave-management" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <div className="lg:col-span-3">
                    <LeaveRequestForm 
                      leaveTypes={leaveTypes} 
                      currentUser={currentUser}
                      addLeaveRequest={addLeaveRequest}
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <LeaveHistory 
                      requests={leaveRequests}
                      employees={employees}
                      leaveTypes={leaveTypes}
                      currentUser={currentUser} 
                      updateRequestStatus={updateRequestStatus}
                    />
                  </div>
              </div>
            </TabsContent>
            <TabsContent value="admin-panel" className="mt-4">
              <AdminPanel 
                employees={employees} 
                onUpdateEmployee={handleUpdateEmployee} 
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="lg:col-span-3">
                <LeaveRequestForm 
                  leaveTypes={leaveTypes} 
                  currentUser={currentUser}
                  addLeaveRequest={addLeaveRequest}
                />
              </div>
              <div className="lg:col-span-4">
                <LeaveHistory 
                  requests={leaveRequests}
                  employees={employees}
                  leaveTypes={leaveTypes}
                  currentUser={currentUser} 
                  updateRequestStatus={updateRequestStatus}
                />
              </div>
          </div>
        )}
      </main>
    </div>
  );
}
