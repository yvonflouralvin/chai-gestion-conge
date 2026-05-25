"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import type { LeaveRequestHistoryEntry, LeaveRequest } from "@/types";
import { getLeaveRequestHistory } from "@/lib/leave-history";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { deleteLeaveRequest } from "@/lib/requests";

type LeaveRequestDeleteDialogProps = {
  request: LeaveRequest | null;
  open: boolean;
  onClose: () => void;
};

export function LeaveRequestDeleteDialog({
  request,
  open,
  onClose,
}: LeaveRequestDeleteDialogProps) {
  const [history, setHistory] = useState<LeaveRequestHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (requestId: string) => {
    try {
      setLoading(true);
      await deleteLeaveRequest(requestId);
      onClose();
    } catch (error) {
      console.error("Error deleting leave request:", error);
    } finally {
      setLoading(false);
    }
  }



  if (!request) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Supprimer la demande de congé</DialogTitle>
          <DialogDescription className="text-black">
            Êtes-vous sûr de vouloir supprimer cette demande de congé ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {
            loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Button variant="outline" onClick={() => onClose()}>Annuler</Button>
                <Button variant="destructive" onClick={() => handleDelete(request.id)}>Supprimer</Button>
              </>
            )
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

