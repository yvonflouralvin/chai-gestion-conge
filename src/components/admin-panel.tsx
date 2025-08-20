
"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Edit, UserPlus, X, Loader2 } from "lucide-react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import type { Employee, ContractType, EmployeeRole } from "@/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

const employeeSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  title: z.string().min(2, { message: "Title is required." }),
  team: z.string().min(2, { message: "Team is required." }),
  role: z.enum(["Employee", "Supervisor", "Manager", "Admin"]),
  contractType: z.enum(["Full-time", "Part-time", "Contract"]),
  supervisorId: z.string().nullable(),
  contractStartDate: z.date({ required_error: "A start date is required." }),
  contractEndDate: z.date().nullable(),
});

export function AdminPanel() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData: Employee[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          title: data.title,
          team: data.team,
          avatar: data.avatar || `https://placehold.co/40x40.png`,
          supervisorId: data.supervisorId,
          role: data.role as EmployeeRole,
          contractType: data.contractType as ContractType,
          contractStartDate: data.contractStartDate.toDate(),
          contractEndDate: data.contractEndDate ? data.contractEndDate.toDate() : null,
        };
      });
      setEmployees(usersData);
    } catch (error) {
      console.error("Error fetching employees: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch employees from Firestore.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (editingEmployee) {
      form.reset({
        name: editingEmployee.name,
        title: editingEmployee.title,
        team: editingEmployee.team,
        role: editingEmployee.role,
        contractType: editingEmployee.contractType,
        supervisorId: editingEmployee.supervisorId ? String(editingEmployee.supervisorId) : null,
        contractStartDate: editingEmployee.contractStartDate,
        contractEndDate: editingEmployee.contractEndDate,
      });
    } else {
      form.reset({
        name: "",
        title: "",
        team: "",
        role: "Employee",
        contractType: "Full-time",
        supervisorId: null,
        contractStartDate: undefined,
        contractEndDate: null,
      });
    }
  }, [editingEmployee, form]);

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setEditingEmployee(null);
    setIsEditDialogOpen(false);
  }

  async function onSubmit(values: z.infer<typeof employeeSchema>) {
    if (!editingEmployee) return;

    try {
        const employeeRef = doc(db, "users", editingEmployee.id.toString());
        await updateDoc(employeeRef, {
            name: values.name,
            title: values.title,
            team: values.team,
            role: values.role,
            contractType: values.contractType,
            supervisorId: values.supervisorId ? parseInt(values.supervisorId) : null,
            contractStartDate: values.contractStartDate,
            contractEndDate: values.contractEndDate,
        });

        toast({
            title: "Employee Updated",
            description: `${values.name}'s information has been successfully updated.`,
        });
        
        fetchEmployees(); // Refetch to show updated data
        handleDialogClose();

    } catch (error) {
        console.error("Error updating employee: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update employee in Firestore.",
        });
    }
  }

  const getSupervisorName = (supervisorId: number | null) => {
    if (!supervisorId) return "N/A";
    const supervisor = employees.find(e => e.id === supervisorId.toString());
    return supervisor?.name || "Unknown";
  };

  const potentialSupervisors = employees.filter(e => e.id !== editingEmployee?.id && (e.role === 'Supervisor' || e.role === 'Manager' || e.role === 'Admin'));

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>View and manage employee details.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Employee Management</CardTitle>
            <CardDescription>View and manage employee details.</CardDescription>
        </div>
        <Button disabled>
            <UserPlus className="mr-2 h-4 w-4"/>
            Add Employee
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Title</TableHead>
                <TableHead className="hidden lg:table-cell">Contract</TableHead>
                <TableHead className="hidden lg:table-cell">Supervisor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.map((employee) => (
                <TableRow key={employee.id}>
                    <TableCell>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground md:hidden">{employee.title}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{employee.title}</TableCell>
                    <TableCell className="hidden lg:table-cell">{employee.contractType}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getSupervisorName(employee.supervisorId)}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(employee)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Employee: {editingEmployee?.name}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="team" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Team</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Employee">Employee</SelectItem>
                                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="contractType" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contract Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Full-time">Full-time</SelectItem>
                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="supervisorId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supervisor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a supervisor" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="">N/A</SelectItem>
                                    {potentialSupervisors.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="contractStartDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Contract Start Date</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="contractEndDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Contract End Date</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Ongoing</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-2 flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => field.onChange(null)}>Clear</Button>
                                </div>
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                            </PopoverContent></Popover>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
