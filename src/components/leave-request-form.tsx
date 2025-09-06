
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, calculateLeaveDays, getFirstContract } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmployeeWithCurrentContract, LeaveRequest, LeaveType, CircumstanceType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { leaveTypes } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Info } from "lucide-react";

const formSchema = z.object({
  leaveTypeId: z.string().min(1, { message: "Please select a leave type." }),
  circumstanceType: z.string().optional(),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
  document: z.any().optional(), // For file upload
}).refine(data => {
    const leaveType = leaveTypes.find(lt => lt.id === parseInt(data.leaveTypeId, 10));
    if (leaveType && leaveType.subTypes && !data.circumstanceType) {
        return false;
    }
    return true;
}, {
    message: "Please select a circumstance type.",
    path: ["circumstanceType"],
});

type LeaveRequestFormProps = {
  currentUser: EmployeeWithCurrentContract;
  addLeaveRequest: (request: Omit<LeaveRequest, "id">) => void;
  leaveRequests: LeaveRequest[];
};

export function LeaveRequestForm({ currentUser, addLeaveRequest, leaveRequests }: LeaveRequestFormProps) {
  const [leaveDays, setLeaveDays] = useState(0);
  const [availableLeaveDays, setAvailableLeaveDays] = useState(0);
  const [availablePaternityDays, setAvailablePaternityDays] = useState(0);
  const [availableMaternityDays, setAvailableMaternityDays] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        circumstanceType: "",
    }
  });

  const { watch, control } = form;
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const leaveTypeId = watch("leaveTypeId");

  const selectedLeaveType = leaveTypes.find(lt => lt.id === parseInt(leaveTypeId, 10));

  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateLeaveDays(startDate, endDate);
      setLeaveDays(days);
    } else {
      setLeaveDays(0);
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    const currentYear = new Date().getFullYear();

    // Annual Leave Calculation
    const firstContract = getFirstContract(currentUser);
    if (!firstContract) {
        setAvailableLeaveDays(0);
    } else {
        const today = new Date();
        const contractStart = new Date(firstContract.startDate);
        let monthsWorked = (today.getFullYear() - contractStart.getFullYear()) * 12;
        monthsWorked -= contractStart.getMonth();
        monthsWorked += today.getMonth();
        const accruedLeave = monthsWorked <= 0 ? 0 : monthsWorked * 1.75;

        const takenLeave = leaveRequests
          .filter(r => r.employeeId === currentUser.id && r.status === 'Approved' && r.leaveTypeId === 1)
          .reduce((acc, req) => acc + calculateLeaveDays(req.startDate, req.endDate), 0);
          
        setAvailableLeaveDays(Math.floor(accruedLeave - takenLeave));
    }

    // Paternity Leave Calculation
    const takenPaternityLeave = leaveRequests
        .filter(r => 
            r.employeeId === currentUser.id && 
            r.status === 'Approved' && 
            r.leaveTypeId === 3 && // Paternity leave ID
            r.startDate.getFullYear() === currentYear
        )
        .reduce((acc, req) => acc + calculateLeaveDays(req.startDate, req.endDate), 0);
    
    setAvailablePaternityDays(30 - takenPaternityLeave);

    // Maternity Leave Calculation
    const takenMaternityLeave = leaveRequests
        .filter(r => 
            r.employeeId === currentUser.id && 
            r.status === 'Approved' && 
            r.leaveTypeId === 5 && // Maternity leave ID
            r.startDate.getFullYear() === currentYear
        )
        .reduce((acc, req) => acc + calculateLeaveDays(req.startDate, req.endDate), 0);
    
    setAvailableMaternityDays(90 - takenMaternityLeave);

  }, [currentUser, leaveRequests]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedLeaveTypeId = parseInt(values.leaveTypeId, 10);
    
    // Validation for Annual leave (ID 1)
    if (selectedLeaveTypeId === 1 && leaveDays > availableLeaveDays) {
      toast({
        variant: "destructive",
        title: "Insufficient Annual Leave",
        description: `You are requesting ${leaveDays} days, but you only have ${availableLeaveDays} available.`,
      });
      return;
    }

    // Validation for Paternity leave (ID 3)
    if (selectedLeaveTypeId === 3 && leaveDays > availablePaternityDays) {
       toast({
        variant: "destructive",
        title: "Insufficient Paternity Leave",
        description: `You are requesting ${leaveDays} days, but you only have ${availablePaternityDays} available for this year.`,
      });
      return;
    }

    // Validation for Maternity leave (ID 5)
    if (selectedLeaveTypeId === 5 && leaveDays > availableMaternityDays) {
       toast({
        variant: "destructive",
        title: "Insufficient Maternity Leave",
        description: `You are requesting ${leaveDays} days, but you only have ${availableMaternityDays} available for this year.`,
      });
      return;
    }
    
    // Placeholder for file upload logic
    let documentUrl: string | null = null;
    if (selectedLeaveTypeId === 5 && values.document) {
        // **FILE UPLOAD LOGIC SHOULD GO HERE**
        // 1. Upload the file to Firebase Storage
        // 2. Get the download URL
        // 3. Set `documentUrl` to the download URL
        // Example: documentUrl = await uploadFile(values.document);
        toast({
            title: "File Upload Pending",
            description: "File upload functionality is not yet implemented.",
        });
    }

    const newRequest: Omit<LeaveRequest, "id"> = {
      employeeId: currentUser.id,
      leaveTypeId: selectedLeaveTypeId,
      circumstanceType: (values.circumstanceType as CircumstanceType) || null,
      startDate: values.startDate,
      endDate: values.endDate,
      status: "Pending Supervisor" as const,
      supervisorReason: "",
      managerReason: "",
      comment: "",
      submissionDate: new Date(),
      documentUrl: documentUrl
    };

    addLeaveRequest(newRequest);
    form.reset();
  }
  
  const renderAvailableDays = () => {
    const selectedLeaveTypeId = parseInt(leaveTypeId, 10);
    if (selectedLeaveTypeId === 1 || !leaveTypeId) {
        return (
            <div className="rounded-md border bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">Available Annual Leave Days</p>
                <p className="text-2xl font-bold">{availableLeaveDays}</p>
            </div>
        )
    }
    if (selectedLeaveTypeId === 3) {
         return (
            <div className="rounded-md border bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">Available Paternity Leave Days (This Year)</p>
                <p className="text-2xl font-bold">{availablePaternityDays}</p>
            </div>
        )
    }
     if (selectedLeaveTypeId === 5) {
         return (
            <div className="rounded-md border bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">Available Maternity Leave Days (This Year)</p>
                <p className="text-2xl font-bold">{availableMaternityDays}</p>
            </div>
        )
    }
    return null;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>New Leave Request</CardTitle>
        <CardDescription>Fill out the form to request time off.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {renderAvailableDays()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="leaveTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type of leave" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                             <div className="flex items-center gap-2">
                               <type.icon className="h-4 w-4 text-muted-foreground" />
                               <span>{type.name}</span>
                             </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedLeaveType?.subTypes && (
                 <FormField
                    control={control}
                    name="circumstanceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Circumstance</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a circumstance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedLeaveType.subTypes?.map((subType) => (
                              <SelectItem key={subType} value={subType}>
                                {subType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}
            </div>

            {selectedLeaveType?.id === 5 && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Document Required</AlertTitle>
                    <AlertDescription>
                        Please attach a medical document.
                        {/* 
                            FILE UPLOAD COMPONENT GOES HERE
                            Example: <Input type="file" {...form.register("document")} />
                            This component needs to be implemented.
                        */}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            startDate ? date < startDate : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="rounded-md border bg-muted/50 p-3 text-center">
              <p className="text-sm text-muted-foreground">Total Leave Days in Request</p>
              <p className="text-2xl font-bold">{leaveDays}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Submit Request</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    