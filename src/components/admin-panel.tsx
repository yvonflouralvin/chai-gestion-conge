
"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Edit, UserPlus, X, Loader2 } from "lucide-react"
import { collection, doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

import type { EmployeeWithCurrentContract, Contract, ContractType, EmployeeRole, LeaveRequest } from "@/types"
import { cn, calculateLeaveDays, getCurrentContract, getFirstContract } from "@/lib/utils"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAuth } from "@/context/auth-context"

const employeeSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(["Employee", "Supervisor", "Manager", "Admin"]),
  supervisorId: z.string().nullable(),
});

const contractSchema = z.object({
  title: z.string().min(2, { message: "Title is required." }),
  team: z.string().min(2, { message: "Team is required." }),
  contractType: z.enum(["Contrat-Staff", "Contrat-Independant", "Contract"]),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date().nullable(),
});

type AdminPanelProps = {
    leaveRequests: LeaveRequest[];
    employees: EmployeeWithCurrentContract[];
    onEmployeesUpdate: () => void;
};

export function AdminPanel({ leaveRequests, employees, onEmployeesUpdate }: AdminPanelProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithCurrentContract | null>(null);

  const employeeForm = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
  });

  const contractForm = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
  });

  useEffect(() => {
    if (editingEmployee) {
        employeeForm.reset({
            name: editingEmployee.name,
            email: editingEmployee.email,
            role: editingEmployee.role,
            supervisorId: editingEmployee.supervisorId ? String(editingEmployee.supervisorId) : null,
        });
        const currentContract = getCurrentContract(editingEmployee);
        if (currentContract) {
            contractForm.reset({
                title: currentContract.title,
                team: currentContract.team,
                contractType: currentContract.contractType,
                startDate: currentContract.startDate,
                endDate: currentContract.endDate,
            });
        }
    } else {
        employeeForm.reset({ name: "", email: "", role: "Employee", supervisorId: null });
        contractForm.reset({ title: "", team: "", contractType: "Contrat-Staff", startDate: new Date(), endDate: null });
    }
  }, [editingEmployee, isAddDialogOpen, employeeForm, contractForm]);

  const handleEditClick = (employee: EmployeeWithCurrentContract) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setEditingEmployee(null);
    setIsEditDialogOpen(false);
    setIsAddDialogOpen(false);
    employeeForm.reset();
    contractForm.reset();
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
        const contractValues = await contractForm.trigger() ? contractForm.getValues() : null;
        if (!contractValues) {
            setIsFormSubmitting(false);
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, tempPassword);
        const user = userCredential.user;

        const newContract: Contract = {
            title: contractValues.title,
            team: contractValues.team,
            contractType: contractValues.contractType,
            startDate: contractValues.startDate,
            endDate: contractValues.endDate,
        };

        await setDoc(doc(db, "users", user.uid), {
            name: values.name,
            email: values.email,
            role: values.role,
            supervisorId: getSupervisorIdValue(values),
            avatar: `https://placehold.co/40x40.png`,
            contracts: [newContract],
        });

        await sendPasswordResetEmail(auth, values.email);
        
        await auth.updateCurrentUser(adminUser);

        toast({
            title: "Employee Added",
            description: `${values.name} has been added and a setup email has been sent.`,
        });

        onEmployeesUpdate();
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
        const employeeRef = doc(db, "users", editingEmployee.id);
        await updateDoc(employeeRef, {
            name: values.name,
            role: values.role,
            supervisorId: getSupervisorIdValue(values),
        });

        toast({
            title: "Employee Updated",
            description: `${values.name}'s information has been successfully updated.`,
        });
        
        onEmployeesUpdate();
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

  async function handleAddContract(values: z.infer<typeof contractSchema>) {
      if (!editingEmployee) return;
      setIsFormSubmitting(true);
      try {
        const newContract: Contract = {
            title: values.title,
            team: values.team,
            contractType: values.contractType,
            startDate: values.startDate,
            endDate: values.endDate
        };

        const employeeRef = doc(db, "users", editingEmployee.id);
        await updateDoc(employeeRef, {
            contracts: arrayUnion(newContract)
        });

         toast({
            title: "Contract Added",
            description: `A new contract has been added for ${editingEmployee.name}.`,
        });

        onEmployeesUpdate();
        handleDialogClose();

      } catch (error) {
          console.error("Error adding contract: ", error);
          toast({
            variant: "destructive",
            title: "Failed to Add Contract",
            description: "Could not add new contract.",
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
  
  const getAvailableLeaveDays = (employee: EmployeeWithCurrentContract) => {
    const firstContract = getFirstContract(employee);
    if (!firstContract) return 0;

    const today = new Date();
    const contractStart = new Date(firstContract.startDate);
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

  const FormFields = ({ isContract, isEdit }: { isContract?: boolean, isEdit?: boolean }) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isContract && <>
            <FormField control={employeeForm.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={employeeForm.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} type="email" disabled={isEdit} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
          </>}

          <FormField control={contractForm.control} name="title" render={({ field }) => (
              <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl><Input {...field} disabled={isContract && isEdit} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField control={contractForm.control} name="team" render={({ field }) => (
              <FormItem>
                  <FormLabel>Team</FormLabel>
                  <FormControl><Input {...field} disabled={isContract && isEdit} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />

          {!isContract && <>
            <FormField control={employeeForm.control} name="role" render={({ field }) => (
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
            <FormField control={employeeForm.control} name="supervisorId" render={({ field }) => (
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
          </>}
          
          <FormField control={contractForm.control} name="contractType" render={({ field }) => (
              <FormItem>
                  <FormLabel>Contract Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isContract && isEdit}>
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
          
          <FormField control={contractForm.control} name="startDate" render={({ field }) => (
              <FormItem className="flex flex-col">
                  <FormLabel>Contract Start Date</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isContract && isEdit}>
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
          <FormField control={contractForm.control} name="endDate" render={({ field }) => (
              <FormItem className="flex flex-col">
                  <FormLabel>Contract End Date (optional)</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isContract && isEdit}>
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
    </>
  );

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
                <TableHead>Title</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Contract Start</TableHead>
                <TableHead>Contract End</TableHead>
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
                    <TableCell>{employee.title}</TableCell>
                    <TableCell>{getAvailableLeaveDays(employee)}</TableCell>
                    <TableCell>{format(employee.contractStartDate, "MMM d, yyyy")}</TableCell>
                    <TableCell>
                        {employee.contractEndDate
                        ? format(employee.contractEndDate, "MMM d, yyyy")
                        : "Ongoing"}
                    </TableCell>
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
            {isEditDialogOpen && (
                <Tabs defaultValue="employee">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="employee">Employee Details</TabsTrigger>
                        <TabsTrigger value="contract">New Contract</TabsTrigger>
                    </TabsList>
                    <TabsContent value="employee">
                        <Form {...employeeForm}>
                            <form onSubmit={employeeForm.handleSubmit(handleUpdateEmployee)} className="space-y-4 py-4">
                                <FormFields isEdit />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                                    <Button type="submit" disabled={isFormSubmitting}>
                                        {isFormSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>

                        <Accordion type="single" collapsible className="w-full mt-4">
                          <AccordionItem value="item-1">
                            <AccordionTrigger>View Contract History</AccordionTrigger>
                            <AccordionContent>
                                {editingEmployee && editingEmployee.contracts.length > 0 ? (
                                    <div className="space-y-4 p-2 border rounded-md">
                                        {[...editingEmployee.contracts].sort((a,b) => b.startDate.getTime() - a.startDate.getTime()).map((contract, index) => (
                                            <div key={index} className="text-sm">
                                                <p><strong>Title:</strong> {contract.title}</p>
                                                <p><strong>Team:</strong> {contract.team}</p>
                                                <p><strong>Type:</strong> {contract.contractType}</p>
                                                <p><strong>Period:</strong> {format(contract.startDate, "MMM d, yyyy")} - {contract.endDate ? format(contract.endDate, "MMM d, yyyy") : 'Ongoing'}</p>
                                                {index < editingEmployee.contracts.length - 1 && <hr className="my-2"/>}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p>No contract history.</p>}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                    </TabsContent>
                    <TabsContent value="contract">
                        <Form {...contractForm}>
                            <form onSubmit={contractForm.handleSubmit(handleAddContract)} className="space-y-4 py-4">
                                <p className="text-sm text-muted-foreground">Add a new contract for this employee. The previous contract will be archived.</p>
                                <FormFields isContract />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                                    <Button type="submit" disabled={isFormSubmitting}>
                                        {isFormSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add New Contract"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            )}
            {isAddDialogOpen && (
                <Form {...employeeForm}>
                    <form onSubmit={employeeForm.handleSubmit(handleAddEmployee)} className="space-y-4 py-4">
                        <Form {...contractForm}>
                           <FormFields />
                        </Form>
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                            <Button type="submit" disabled={isFormSubmitting}>
                                {isFormSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Employee"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
