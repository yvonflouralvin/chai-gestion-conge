
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
import type { EmployeeWithCurrentContract, LeaveRequest, LeaveRequestStatus, LeaveType } from "@/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { calculateLeaveDays } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type LeaveHistoryProps = {
  requests: LeaveRequest[];
  employees: EmployeeWithCurrentContract[];
  leaveTypes: LeaveType[];
  currentUser: EmployeeWithCurrentContract;
  updateRequestStatus: (requestId: string, status: LeaveRequestStatus, reason?: string) => void;
  view: "personal" | "approvals" | "all"; 
};

type StatusFilter = LeaveRequestStatus | "All";

export function LeaveHistory({ requests, employees, leaveTypes, currentUser, updateRequestStatus, view }: LeaveHistoryProps) {
    const { toast } = useToast();
    const [reason, setReason] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');


    const getEmployeeName = (id: number | string) => employees.find(e => e.id === id)?.name || 'Unknown';
    const getLeaveTypeName = (id: number) => leaveTypes.find(lt => lt.id === id)?.name || 'Unknown';
    const getLeaveTypeIcon = (id: number) => {
        const Icon = leaveTypes.find(lt => lt.id === id)?.icon;
        return Icon ? <Icon className="h-4 w-4 mr-2" /> : null;
    }

    const getStatusBadge = (request: LeaveRequest) => {
        const status = request.status;
        
        let rejectionContent = null;
        if (status === 'Rejected') {
            const employee = employees.find(e => e.id === request.employeeId);
            if (employee && employee.supervisorId) {
                 const supervisor = employees.find(e => e.id === employee.supervisorId);
                 if (supervisor && request.supervisorReason) {
                     rejectionContent = (
                        <p><strong>{supervisor.name} (Supervisor):</strong> {request.supervisorReason}</p>
                     )
                 }
            }
            if (!rejectionContent && request.managerReason) {
                const manager = employees.find(e => e.role === 'Manager' && e.id !== request.employeeId);
                 if(manager) {
                    rejectionContent = (
                        <p><strong>{manager.name} (Manager):</strong> {request.managerReason}</p>
                    );
                 } else {
                     rejectionContent = (
                        <p><strong>Manager:</strong> {request.managerReason}</p>
                     );
                 }
            }
             if (!rejectionContent) {
                rejectionContent = <p>{request.supervisorReason || request.managerReason}</p>
            }

        }

        const badge = () => {
             switch (status) {
                case 'Approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
                case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
                case 'Pending Supervisor': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-500">Pending Supervisor</Badge>;
                case 'Pending Manager': return <Badge variant="secondary" className="bg-orange-400 text-black hover:bg-orange-500">Pending Manager</Badge>;
            }
        }
        
        return (
            <div className="flex items-center gap-2">
                {badge()}
                {status === 'Rejected' && rejectionContent && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                {rejectionContent}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        )
    }
    
    let baseRequests: LeaveRequest[] = [];
    let title = "My Leave History";
    let description = "A history of all your leave requests.";
    let showEmployeeColumn = true;
    let showActionsColumn = true;
    let emptyStateMessage = "You have no leave requests.";
    let showFilters = false;

    switch (view) {
        case 'personal':
            baseRequests = requests.filter(r => r.employeeId === currentUser.id);
            showEmployeeColumn = false;
            showActionsColumn = false;
            break;
        case 'approvals':
            if (currentUser.role === 'Supervisor') {
                title = "Team Leave Approvals";
                description = "Review and act on pending leave requests from your team.";
                const supervisedEmployeeIds = employees.filter(e => e.supervisorId === currentUser.id).map(e => e.id);
                baseRequests = requests.filter(r => supervisedEmployeeIds.includes(r.employeeId));
                emptyStateMessage = "No pending requests from your team.";
                showFilters = true;
            } else if (currentUser.role === 'Manager') {
                title = "Pending My Approval";
                description = "Review and act on pending leave requests.";
                baseRequests = requests.filter(r => r.status === 'Pending Manager' || r.status === 'Approved' || r.status === 'Rejected');
                emptyStateMessage = "No pending requests.";
                showFilters = true;
            }
            break;
        case 'all':
            title = "All Leave Requests";
            description = "A history of all leave requests across the company.";
            baseRequests = requests;
            emptyStateMessage = "No leave requests found.";
            showActionsColumn = false;
            showFilters = true;
            break;
    }

    const filteredRequests = (statusFilter === 'All'
        ? baseRequests
        : baseRequests.filter(r => r.status === statusFilter)
    ).sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());


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
            setReason("");
            setSelectedRequest(null);
        } else {
            toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for rejection."});
        }
    }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </div>
        {showFilters && (
            <div className="w-[180px]">
                <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Pending Supervisor">Pending Supervisor</SelectItem>
                        <SelectItem value="Pending Manager">Pending Manager</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showEmployeeColumn && <TableHead>Employee</TableHead>}
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="hidden sm:table-cell">Submitted</TableHead>
              <TableHead className="text-center">Days</TableHead>
              <TableHead>Status</TableHead>
              {showActionsColumn && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  {showEmployeeColumn && <TableCell>{getEmployeeName(request.employeeId)}</TableCell>}
                  <TableCell className="flex items-center">{getLeaveTypeIcon(request.leaveTypeId)} {getLeaveTypeName(request.leaveTypeId)}</TableCell>
                  <TableCell>{format(request.startDate, 'MMM d')} - {format(request.endDate, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="hidden sm:table-cell">{format(request.submissionDate, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-center">{calculateLeaveDays(request.startDate, request.endDate)}</TableCell>
                  <TableCell>{getStatusBadge(request)}</TableCell>
                  {showActionsColumn && 
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                             <Button size="sm" onClick={() => handleApprove(request)} disabled={request.status === 'Approved' || request.status === 'Rejected' || (currentUser.role === 'Supervisor' && request.status !== 'Pending Supervisor') || (currentUser.role === 'Manager' && request.status !== 'Pending Manager') }>Approve</Button>
                            <Dialog onOpenChange={(open) => { if(!open) { setReason(""); setSelectedRequest(null); }}}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="destructive" onClick={() => setSelectedRequest(request)} disabled={request.status === 'Approved' || request.status === 'Rejected'}>Reject</Button>
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
                    <TableCell colSpan={ (showEmployeeColumn ? 1 : 0) + (showActionsColumn ? 1 : 0) + 5 } className="text-center h-24">
                        {emptyStateMessage}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
