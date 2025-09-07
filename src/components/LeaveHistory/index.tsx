import { Badge } from "@/components/ui/badge";
import { EmployeeWithCurrentContract, LeaveRequest, LeaveRequestStatus } from "@/types";
import { Info, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useEffect, useState } from "react";
import { getEmployeeById, getManager } from "@/lib/employee";
import { leaveTypes } from "@/lib/data";


export const getLeaveTypeIcon = (id: number) => {
    const Icon = leaveTypes.find(lt => lt.id === id)?.icon;
    return Icon ? <Icon className="h-4 w-4 mr-2" /> : null;
}

export const getLeaveTypeName = (request: LeaveRequest) => {
        const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
        if (!leaveType) return 'Unknown';
        if (leaveType.id === 4 && request.circumstanceType) { // Circumstance Leave
            return `${leaveType.name} (${request.circumstanceType})`;
        }
        return leaveType.name;
};

export const badge = () => {
        switch (status) {
        case 'Approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
        case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
        case 'Pending Supervisor': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-500">Pending Supervisor</Badge>;
        case 'Pending Manager': return <Badge variant="secondary" className="bg-orange-400 text-black hover:bg-orange-500">Pending Manager</Badge>;
    }
}



export type StatusFilter = LeaveRequestStatus | "All";

export const StatusBadge = (props: {
    request: LeaveRequest
}) => {
        const request = props.request; 
        const [employee, setEmployee] = useState<EmployeeWithCurrentContract|null>(null)
        const [supervisor, setSupervisor] = useState<EmployeeWithCurrentContract|null>(null)
        const [manager, setManager] = useState<EmployeeWithCurrentContract|null>(null)

        useEffect(()=>{
            getEmployeeById(request.employeeId).then(employee=>{
                setEmployee(employee)
                if(employee && employee.supervisorId)
                getEmployeeById(employee.supervisorId).then(supervisor=>{
                    setSupervisor(supervisor)
                })
            })
            getManager().then(manager=>{
                setManager(manager)
            })
        }, [])
        
        const [tooltipContent, setTooltipContent] = useState<any>()

        const badge = () => {
            const status = request.status;
            // let tooltipContent = null;
            if (status === 'Rejected') {
                
                if (employee) {
                    if (request.supervisorReason) {
                        
                        if (supervisor) {
                            setTooltipContent(<p><strong>{supervisor.name} (Supervisor):</strong> {request.supervisorReason}</p>)
                        }
                    } else if (request.managerReason) { 
                        if(manager) {
                            setTooltipContent(<p><strong>{manager.name} (Manager):</strong> {request.managerReason}</p>)
                        }
                    }
                }
                if (!tooltipContent && (request.supervisorReason || request.managerReason)) {
                    setTooltipContent(<p>{request.supervisorReason || request.managerReason}</p>)
                }
            } else if (request.comment) {
                setTooltipContent(<p><strong>Comment:</strong> {request.comment}</p>)
            }

             switch (status) {
                case 'Approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
                case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
                case 'Pending Supervisor': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-500">Pending Supervisor</Badge>;
                case 'Pending Manager': return <Badge variant="secondary" className="bg-orange-400 text-black hover:bg-orange-500">Pending Manager</Badge>;
            }
        }
        
        return (
            <div className="flex items-center gap-2">
                {
                    employee != null && supervisor != null && manager != null ?
                    <>{badge()}</> : <></>
                }
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