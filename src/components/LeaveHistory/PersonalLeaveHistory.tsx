"use client"

import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaveRequest } from "@/types";
import { getLeaveTypeIcon, getLeaveTypeName, StatusBadge, StatusFilter } from ".";
import { useState } from "react";

import { calculateLeaveDays, cn } from "@/lib/utils";

let title = "My Leave History";
let description = "A history of all your leave requests.";

export default function PersonalLeaveHistory(props: {
    requests: LeaveRequest[]
}){


    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    let baseRequests: LeaveRequest[] = props.requests;

    const filteredRequests = (statusFilter === 'All'
        ? baseRequests
        : baseRequests.filter(r => r.status === statusFilter)
    ).sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());


    return (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow> 
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                  <TableHead className="text-center">Days</TableHead>
                  <TableHead>Status</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}> 
                      <TableCell className="flex items-center">{getLeaveTypeIcon(request.leaveTypeId)} {getLeaveTypeName(request)}</TableCell>
                      <TableCell>{format(request.startDate, 'MMM d')} - {format(request.endDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell className="hidden sm:table-cell">{format(request.submissionDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-center">{calculateLeaveDays(request.startDate, request.endDate)}</TableCell>
                      <TableCell><StatusBadge request={request} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        {/* <TableCell colSpan={ (showEmployeeColumn ? 1 : 0) + (showActionsColumn ? 1 : 0) + 5 } className="text-center h-24">
                            {emptyStateMessage}
                        </TableCell> */}
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
       
      );
}