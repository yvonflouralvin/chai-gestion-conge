
"use client";

import { useState, useEffect } from "react";
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
import type { EmployeeWithCurrentContract, LeaveRequest, LeaveRequestStatus } from "@/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { calculateLeaveDays, cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Info, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { leaveTypes } from "@/lib/data";

type LeaveHistoryProps = {
  requests: LeaveRequest[];
  employees: EmployeeWithCurrentContract[];
  currentUser: EmployeeWithCurrentContract;
  updateRequestStatus: (
    requestId: string, 
    status: LeaveRequestStatus, 
    details?: { 
        reason?: string; 
        comment?: string;
        startDate?: Date;
        endDate?: Date;
    }
  ) => void;
  view: "personal" | "approvals" | "all" ; 
};

type StatusFilter = LeaveRequestStatus | "All";

export function LeaveHistory({ requests, employees, currentUser, updateRequestStatus, view }: LeaveHistoryProps) {
    const { toast } = useToast();
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    
    // State for approval dialog
    const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
    const [approvalComment, setApprovalComment] = useState("");
    const [approvalStartDate, setApprovalStartDate] = useState<Date | undefined>();
    const [approvalEndDate, setApprovalEndDate] = useState<Date | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (selectedRequest) {
            setApprovalComment(selectedRequest.comment || "");
            setApprovalStartDate(selectedRequest.startDate);
            setApprovalEndDate(selectedRequest.endDate);
        }
    }, [selectedRequest]);

    const handleApprovalDialogClose = () => {
        setIsApprovalDialogOpen(false);
        setSelectedRequest(null);
        setApprovalComment("");
        setApprovalStartDate(undefined);
        setApprovalEndDate(undefined);
    }


    const getEmployeeName = (id: number | string) => employees.find(e => e.id === id)?.name || 'Unknown';
    
    const getLeaveTypeName = (request: LeaveRequest) => {
        const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
        if (!leaveType) return 'Unknown';
        if (leaveType.id === 4 && request.circumstanceType) { // Circumstance Leave
            return `${leaveType.name} (${request.circumstanceType})`;
        }
        return leaveType.name;
    };
    
    const getLeaveTypeIcon = (id: number) => {
        const Icon = leaveTypes.find(lt => lt.id === id)?.icon;
        return Icon ? <Icon className="h-4 w-4 mr-2" /> : null;
    }

    const getStatusBadge = (request: LeaveRequest) => {
        const status = request.status;
        
        let tooltipContent = null;
        if (status === 'Rejected') {
            const employee = employees.find(e => e.id === request.employeeId);
            if (employee) {
                if (request.supervisorReason) {
                    const supervisor = employees.find(e => e.id === employee.supervisorId);
                    if (supervisor) {
                        tooltipContent = <p><strong>{supervisor.name} (Supervisor):</strong> {request.supervisorReason}</p>
                    }
                } else if (request.managerReason) {
                    const manager = employees.find(e => e.role === 'Manager');
                     if(manager) {
                        tooltipContent = <p><strong>{manager.name} (Manager):</strong> {request.managerReason}</p>
                     }
                }
            }
             if (!tooltipContent && (request.supervisorReason || request.managerReason)) {
                tooltipContent = <p>{request.supervisorReason || request.managerReason}</p>
            }
        } else if (request.comment) {
            tooltipContent = <p><strong>Comment:</strong> {request.comment}</p>
        }

        const badge = () => {
             switch (status) {
                case 'Approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
                case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
                case 'Pending Supervisor': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-500">Pending Supervisor</Badge>;
                case 'Pending Manager': return <Badge variant="secondary" className="bg-orange-400 text-black hover:bg-orange-500">Pending Manager</Badge>;
                case 'Pending HR': return <Badge variant="secondary" className="bg-orange-400 text-black hover:bg-orange-500">Pending HR</Badge>;
            }
        }
        
        return (
            <div className="flex items-center gap-2">
                {badge()}
                {tooltipContent && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                {tooltipContent}
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
            else if (currentUser.role === 'HR') {
                title = "Employee Leave Waiting for Approvals";
                description = "Review and act on pending leave requests.";
                baseRequests = requests.filter(r => r.status === 'Pending HR');
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

    const handleApprove = async () => {
        if (!selectedRequest || !approvalStartDate || !approvalEndDate) return;
        setIsSubmitting(true);

        const role = currentUser.role;

        const _nextStatus = (role : string)=> {
            if(role === "HR") return "Pending Supervisor";
            return role === 'Supervisor' ? 'Pending Manager' : 'Approved';
        } 

        const nextStatus = _nextStatus(role);
        
        await updateRequestStatus(selectedRequest.id, nextStatus, {
            comment: approvalComment,
            startDate: approvalStartDate,
            endDate: approvalEndDate,
        });

        toast({ title: "Request Approved", description: `The request has been updated and moved to ${nextStatus}.`});
        setIsSubmitting(false);
        handleApprovalDialogClose();
    }

    const handleReject = () => {
        if (selectedRequest && rejectionReason) {
            updateRequestStatus(selectedRequest.id, 'Rejected', { reason: rejectionReason });
            setRejectionReason("");
            setSelectedRequest(null);
        } else {
            toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for rejection."});
        }
    }

  return (
    <>
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
                        <SelectItem value="Pending HR">Pending HR</SelectItem>
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
                  <TableCell className="flex items-center">{getLeaveTypeIcon(request.leaveTypeId)} {getLeaveTypeName(request)}</TableCell>
                  <TableCell>{format(request.startDate, 'MMM d')} - {format(request.endDate, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="hidden sm:table-cell">{format(request.submissionDate, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-center">{calculateLeaveDays(request.startDate, request.endDate)}</TableCell>
                  <TableCell>{getStatusBadge(request)}</TableCell>
                  {showActionsColumn && 
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button 
                                size="sm" 
                                onClick={() => {
                                    setSelectedRequest(request);
                                    setIsApprovalDialogOpen(true);
                                }} 
                                disabled={request.status === 'Approved' || request.status === 'Rejected' || (currentUser.role === 'Supervisor' && request.status !== 'Pending Supervisor') || (currentUser.role === 'Manager' && request.status !== 'Pending Manager') }
                            >
                                Approve
                            </Button>
                            <Dialog onOpenChange={(open) => { if(!open) { setRejectionReason(""); setSelectedRequest(null); }}}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="destructive" onClick={() => setSelectedRequest(request)} disabled={request.status === 'Approved' || request.status === 'Rejected'}>Reject</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Leave Request</DialogTitle>
                                        <DialogDescription>Please provide a reason for rejecting this request.</DialogDescription>
                                    </DialogHeader>
                                    <Textarea placeholder="Type your reason here." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
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
    
    {/* Approval Dialog */}
    <Dialog open={isApprovalDialogOpen} onOpenChange={(open) => !open && handleApprovalDialogClose()}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Approve Leave Request</DialogTitle>
                <DialogDescription>
                    Review, modify if necessary, and approve the request for {selectedRequest ? getEmployeeName(selectedRequest.employeeId) : ''}.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="startDate"
                                    variant="outline"
                                    className={cn("w-full justify-start text-left font-normal", !approvalStartDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {approvalStartDate ? format(approvalStartDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={approvalStartDate} onSelect={setApprovalStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="endDate"
                                    variant="outline"
                                    className={cn("w-full justify-start text-left font-normal", !approvalEndDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {approvalEndDate ? format(approvalEndDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={approvalEndDate} onSelect={setApprovalEndDate} disabled={(date) => approvalStartDate ? date < approvalStartDate : false} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Total Days</Label>
                    <div className="rounded-md border bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">{calculateLeaveDays(approvalStartDate, approvalEndDate)}</p>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="approvalComment">Comment (optional)</Label>
                    <Textarea 
                        id="approvalComment"
                        placeholder="Add an optional comment..." 
                        value={approvalComment} 
                        onChange={(e) => setApprovalComment(e.target.value)} 
                    />
                 </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={handleApprovalDialogClose}>Cancel</Button>
                <Button type="button" onClick={handleApprove} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Approval
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
