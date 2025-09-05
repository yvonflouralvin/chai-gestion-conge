
"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Edit, UserPlus, X, Loader2 } from "lucide-react"
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

import type { Employee, ContractType, EmployeeRole, LeaveRequest } from "@/types"
import { cn, calculateLeaveDays } from "@/lib/utils"
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
import { useAuth } from "@/context/auth-context"

const employeeSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  title: z.string().min(2, { message: "Title is required." }),
  team: z.string().min(2, { message: "Team is required." }),
  role: z.enum(["Employee", "Supervisor", "Manager", "Admin"]),
  contractType: z.enum(["Contrat-Staff", "Contrat-Independant", "Contract"]),
  supervisorId: z.string().nullable(),
  contractStartDate: z.date({ required_error: "A start date is required." }),
  contractEndDate: z.date().nullable(),
});

type AdminPanelProps = {
    leaveRequests: LeaveRequest[];
};

export function AdminPanel({ leaveRequests }: AdminPanelProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
    } catch (error: any) {
      console.error("Error fetching employees: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch employees from Firestore.",
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
        email: editingEmployee.email,
        title: editingEmployee.title,
        team: editingEmployee.team,
        role: editingEmployee.role,
        contractType: editingEmployee.contractType,
        supervisorId: editingEmployee.supervisorId ? String(editingEmployee.supervisorId) : null,
        contractStartDate: editingEmployee.contractStartDate,
        contractEndDate: editingEmployee.contractEndDate,
      });
    } else {
      // Default values for the "Add Employee" form
      form.reset({
        name: "",
        email: "",
        title: "",
        team: "",
        role: "Employee",
        contractType: "Contrat-Staff",
        supervisorId: null,
        contractStartDate: new Date(),
        contractEndDate: null,
      });
    }
  }, [editingEmployee, isAddDialogOpen, form]);

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setEditingEmployee(null);
    setIsEditDialogOpen(false);
    setIsAddDialogOpen(false);
    form.reset();
  }

  const getSupervisorIdValue = (values: z.infer<typeof employeeSchema>) => {
      if (!values.supervisorId || values.supervisorId === "na") return null;
      return values.supervisorId;
  }

  async function handleAddEmployee(values: z.infer<typeof employeeSchema>) {
    if (!currentUser) return;
    setIsFormSubmitting(true);
    const tempPassword = "Chai2025";
    
    const adminUser = auth.currentUser;
    if (!adminUser) {
        toast({ variant: "destructive", title: "Authentication Error", description: "Admin user not found." });
        setIsFormSubmitting(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, tempPassword);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: values.name,
        email: values.email,
        title: values.title,
        team: values.team,
        role: values.role,
        contractType: values.contractType,
        supervisorId: getSupervisorIdValue(values),
        contractStartDate: values.contractStartDate,
        contractEndDate: values.contractEndDate,
        avatar: `https://placehold.co/40x40.png`
      });

      await sendPasswordResetEmail(auth, values.email);
      
       await auth.updateCurrentUser(adminUser);


      toast({
          title: "Employee Added",
          description: `${values.name} has been added and a setup email has been sent.`,
      });

      fetchEmployees();
      handleDialogClose();

    } catch (error: any) {
      console.error("Error adding employee: ", error);
      toast({
          variant: "destructive",
          title: "Add Employee Failed",
          description: error.message || "Could not add employee.",
      });
    } finally {
        if (auth.currentUser?.uid !== adminUser.uid) {
           await auth.updateCurrentUser(adminUser);
        }
        setIsFormSubmitting(false);
    }
  }

  async function handleUpdateEmployee(values: z.infer<typeof employeeSchema>) {
    if (!editingEmployee) return;
    setIsFormSubmitting(true);
    try {
        const employeeRef = doc(db, "users", editingEmployee.id.toString());
        await updateDoc(employeeRef, {
            name: values.name,
            title: values.title,
            team: values.team,
            role: values.role,
            contractType: values.contractType,
            supervisorId: getSupervisorIdValue(values),
            contractStartDate: values.contractStartDate,
            contractEndDate: values.contractEndDate,
        });

        toast({
            title: "Employee Updated",
            description: `${values.name}'s information has been successfully updated.`,
        });
        
        fetchEmployees();
        handleDialogClose();

    } catch (error) {
        console.error("Error updating employee: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update employee in Firestore.",
        });
    } finally {
        setIsFormSubmitting(false);
    }
  }

  const getSupervisorName = (supervisorId: string | null) => {
    if (!supervisorId) return "N/A";
    const supervisor = employees.find(e => e.id === supervisorId);
    return supervisor?.name || "Unknown";
  };
  
  const getAvailableLeaveDays = (employee: Employee) => {
    const today = new Date();
    const contractStart = new Date(employee.contractStartDate);
    let monthsWorked = (today.getFullYear() - contractStart.getFullYear()) * 12;
    monthsWorked -= contractStart.getMonth();
    monthsWorked += today.getMonth();
    const accruedLeave = monthsWorked <= 0 ? 0 : monthsWorked * 1.25;

    const takenLeave = leaveRequests
      .filter(r => r.employeeId === employee.id && r.status === 'Approved')
      .reduce((acc, req) => acc + calculateLeaveDays(req.startDate, req.endDate), 0);
      
    return Math.floor(accruedLeave - takenLeave);
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
        <Button onClick={() => setIsAddDialogOpen(true)}>
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
                <TableHead className="hidden lg:table-cell">Days Left</TableHead>
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
                    <TableCell className="hidden lg:table-cell">{getAvailableLeaveDays(employee)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getSupervisorName(employee.supervisorId as string | null)}</TableCell>
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

        <Dialog open={isEditDialogOpen || isAddDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{isAddDialogOpen ? "Add New Employee" : `Edit Employee: ${editingEmployee?.name}`}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(isAddDialogOpen ? handleAddEmployee : handleUpdateEmployee)} className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input {...field} type="email" disabled={!isAddDialogOpen} /></FormControl>
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
                                    <SelectItem value="Contrat-Staff">Contrat Staff</SelectItem>
                                    <SelectItem value="Contrat-Independant">Contrat Independant</SelectItem>
                                    <SelectItem value="Contract">Contrat de stage</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="supervisorId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supervisor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'na'}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a supervisor" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="na">N/A</SelectItem>
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
                            <FormLabel>Contract End Date (optional)</FormLabel>
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
                    <Button type="submit" disabled={isFormSubmitting}>
                         {isFormSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
