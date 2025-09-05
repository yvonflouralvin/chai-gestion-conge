
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
import type { EmployeeWithCurrentContract, LeaveRequest, LeaveType } from "@/types";

const formSchema = z.object({
  leaveTypeId: z.string().min(1, { message: "Please select a leave type." }),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
});

type LeaveRequestFormProps = {
  leaveTypes: LeaveType[];
  currentUser: EmployeeWithCurrentContract;
  addLeaveRequest: (request: Omit<LeaveRequest, "id">) => void;
  leaveRequests: LeaveRequest[];
};

export function LeaveRequestForm({ leaveTypes, currentUser, addLeaveRequest, leaveRequests }: LeaveRequestFormProps) {
  const [leaveDays, setLeaveDays] = useState(0);
  const [availableLeaveDays, setAvailableLeaveDays] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { watch } = form;
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateLeaveDays(startDate, endDate);
      setLeaveDays(days);
    } else {
      setLeaveDays(0);
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    const firstContract = getFirstContract(currentUser);
    if (!firstContract) {
        setAvailableLeaveDays(0);
        return;
    }

    const today = new Date();
    const contractStart = new Date(firstContract.startDate);
    let monthsWorked = (today.getFullYear() - contractStart.getFullYear()) * 12;
    monthsWorked -= contractStart.getMonth();
    monthsWorked += today.getMonth();
    const accruedLeave = monthsWorked <= 0 ? 0 : monthsWorked * 1.25;

    const takenLeave = leaveRequests
      .filter(r => r.employeeId === currentUser.id && r.status === 'Approved')
      .reduce((acc, req) => acc + calculateLeaveDays(req.startDate, req.endDate), 0);
      
    setAvailableLeaveDays(Math.floor(accruedLeave - takenLeave));
  }, [currentUser, leaveRequests]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const newRequest = {
      employeeId: currentUser.id,
      leaveTypeId: parseInt(values.leaveTypeId, 10),
      startDate: values.startDate,
      endDate: values.endDate,
      status: "Pending Supervisor" as const,
      supervisorReason: "",
      managerReason: "",
      submissionDate: new Date(),
    };
    addLeaveRequest(newRequest);
    form.reset();
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
            <div className="rounded-md border bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">Available Leave Days</p>
                <p className="text-2xl font-bold">{availableLeaveDays}</p>
            </div>

            <FormField
              control={form.control}
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
              <p className="text-sm text-muted-foreground">Total Leave Days</p>
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
