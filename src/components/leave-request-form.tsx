"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Wand2 } from "lucide-react";
import { cn, calculateLeaveDays } from "@/lib/utils";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { suggestApprovers } from "@/ai/flows/suggest-approvers";
import type { Employee, LeaveRequest, LeaveType } from "@/types";

const formSchema = z.object({
  leaveTypeId: z.string().min(1, { message: "Please select a leave type." }),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
  approver: z.string().min(3, { message: "Approver name is required." }),
});

type LeaveRequestFormProps = {
  leaveTypes: LeaveType[];
  currentUser: Employee;
  addLeaveRequest: (request: Omit<LeaveRequest, "id">) => void;
};

export function LeaveRequestForm({ leaveTypes, currentUser, addLeaveRequest }: LeaveRequestFormProps) {
  const { toast } = useToast();
  const [leaveDays, setLeaveDays] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [approverRole, setApproverRole] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      approver: "",
    }
  });

  const { watch, setValue } = form;
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

  const handleSuggestApprovers = async () => {
    if (!approverRole) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a role title to get suggestions.",
      });
      return;
    }
    setIsSuggesting(true);
    setAiSuggestions([]);
    try {
      const result = await suggestApprovers({
        roleTitle: approverRole,
        employeeTitle: currentUser.title,
        teamMembership: currentUser.team,
      });
      setAiSuggestions(result.suggestedApprovers);
    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get suggestions. Please try again.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newRequest = {
      employeeId: currentUser.id,
      leaveTypeId: parseInt(values.leaveTypeId, 10),
      startDate: values.startDate,
      endDate: values.endDate,
      status: "Pending Supervisor" as const,
      supervisorReason: "",
      managerReason: "",
      approver: values.approver,
    };
    addLeaveRequest(newRequest);
    toast({
      title: "Request Submitted",
      description: "Your leave request has been submitted for approval.",
    });
    form.reset();
    setAiSuggestions([]);
    setApproverRole("");
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
             <div className="space-y-2">
               <FormLabel>Approver Suggestion</FormLabel>
                <FormDescription>
                  Enter a role (e.g., "my boss") and let AI suggest an approver.
                </FormDescription>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Engineering Manager"
                  value={approverRole}
                  onChange={(e) => setApproverRole(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={handleSuggestApprovers} disabled={isSuggesting}>
                  {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4" />}
                   <span className="sr-only md:not-sr-only md:ml-2">Suggest</span>
                </Button>
              </div>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((name, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue("approver", name, { shouldValidate: true })}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="approver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approver Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter approver's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Submit Request</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
