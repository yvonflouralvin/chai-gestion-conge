
"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Badge
} from "@/components/ui/badge";
import type { Employee, LeaveRequest, LeaveRequestStatus, LeaveType } from "@/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { calculateLeaveDays } from "@/lib/utils";

type LeaveHistoryProps = {
  requests: LeaveRequest[];
  employees: Employee[];
  leaveTypes: LeaveType[];
  currentUser: Employee | (Omit<Employee, "id"> & { id: string });
  updateRequestStatus: (requestId: number, status: LeaveRequestStatus, reason?: string) => void;
};

export function LeaveHistory({ requests, employees, leaveTypes, currentUser, updateRequestStatus }: LeaveHistoryProps) {
    const { toast } = useToast();
    const [reason, setReason] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    const getEmployeeName = (id: number | string) => employees.find(e => e.id === id)?.name || 'Unknown';
    const getLeaveTypeName = (id: number) => leaveTypes.find(lt => lt.id === id)?.name || 'Unknown';
    const getLeaveTypeIcon = (id: number) => {
        const Icon = leaveTypes.find(lt => lt.id === id)?.icon;
        return Icon ? <Icon className="h-4 w-4 mr-2" /> : null;
    }

    const getStatusBadge = (status: LeaveRequestStatus) => {
        switch (status) {
            case 'Approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
            case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
            case 'Pending Supervisor': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-500">Pending Supervisor</Badge>;
            case 'Pending Manager': return <Badge variant="secondary" className="bg-orange-400 text-black hover:bg-orange-500">Pending Manager</Badge>;
        }
    }
    
    let filteredRequests: LeaveRequest[] = [];
    let title = "My Leave History";

    if (currentUser.role === 'Employee') {
        filteredRequests = requests.filter(r => r.employeeId === currentUser.id);
    } else if (currentUser.role === 'Supervisor') {
        title = "Pending My Approval";
        const supervisedEmployeeIds = employees.filter(e => e.supervisorId === currentUser.id).map(e => e.id);
        filteredRequests = requests.filter(r => supervisedEmployeeIds.includes(r.employeeId) && r.status === 'Pending Supervisor');
    } else if (currentUser.role === 'Manager') {
        title = "Pending My Approval";
        filteredRequests = requests.filter(r => r.status === 'Pending Manager');
    } else if (currentUser.role === 'Admin') {
        title = "All Leave Requests";
        filteredRequests = requests;
    }


    const handleApprove = (request: LeaveRequest) => {
        if (currentUser.role === 'Supervisor') {
            updateRequestStatus(request.id, 'Pending Manager');
            toast({ title: "Request Approved", description: "The request has been forwarded to the manager."});
        } else if (currentUser.role === 'Manager') {
            updateRequestStatus(request.id, 'Approved');
            toast({ title: "Request Approved", description: "The leave request is fully approved."});
        }
    }

    const handleReject = () => {
        if (selectedRequest && reason) {
            updateRequestStatus(selectedRequest.id, 'Rejected', reason);
            toast({ variant: "destructive", title: "Request Rejected", "description": "The leave request has been rejected."});
            setReason("");
            setSelectedRequest(null);
        } else {
            toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for rejection."});
        }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {currentUser.role === 'Employee'
            ? "A history of all your leave requests."
            : "Review and act on pending leave requests."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {currentUser.role !== 'Employee' && <TableHead>Employee</TableHead>}
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-center">Days</TableHead>
              <TableHead>Status</TableHead>
              {currentUser.role !== 'Employee' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  {currentUser.role !== 'Employee' && <TableCell>{getEmployeeName(request.employeeId)}</TableCell>}
                  <TableCell className="flex items-center">{getLeaveTypeIcon(request.leaveTypeId)} {getLeaveTypeName(request.leaveTypeId)}</TableCell>
                  <TableCell>{format(request.startDate, 'MMM d')} - {format(request.endDate, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-center">{calculateLeaveDays(request.startDate, request.endDate)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  {currentUser.role !== 'Employee' && 
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={() => handleApprove(request)} disabled={currentUser.role === 'Admin'}>Approve</Button>
                            <Dialog onOpenChange={(open) => { if(!open) { setReason(""); setSelectedRequest(null); }}}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="destructive" onClick={() => setSelectedRequest(request)} disabled={currentUser.role === 'Admin'}>Reject</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Leave Request</DialogTitle>
                                        <DialogDescription>Please provide a reason for rejecting this request.</DialogDescription>
                                    </DialogHeader>
                                    <Textarea placeholder="Type your reason here." value={reason} onChange={(e) => setReason(e.target.value)} />
                                    <DialogFooter>
                                        <Button type="submit" onClick={handleReject}>Confirm Rejection</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </TableCell>
                  }
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={currentUser.role === 'Employee' ? 4 : 6} className="text-center h-24">
                        {currentUser.role === 'Employee' ? 'You have no leave requests.' : 'No pending requests.'}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
