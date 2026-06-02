'use client'
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { EmployeeWithCurrentContract } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ResetPasswordDialog {
    isOpen: boolean,
    handleClose: ()=> any,
    employee: EmployeeWithCurrentContract | null
}

export default function ResetPasswordDialog({
    isOpen, 
    handleClose,
    employee
}: ResetPasswordDialog) {

    const [isDialogOpen, setIsDialogOpen] = React.useState(isOpen)

    const close = ()=>{
        handleClose();
        setIsDialogOpen(false)
    }

    return <Dialog open={isDialogOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Reset Password : {employee?.name}</DialogTitle>
            </DialogHeader>
            {isDialogOpen && (
               <div>
                    <input placeholder='New password :'></input>
               </div>
            )}
        </DialogContent>
    </Dialog>

}