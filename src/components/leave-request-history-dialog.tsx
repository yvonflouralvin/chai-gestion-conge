"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import type { LeaveRequestHistoryEntry, LeaveRequest } from "@/types";
import { getLeaveRequestHistory } from "@/lib/leave-history";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

type LeaveRequestHistoryDialogProps = {
  request: LeaveRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LeaveRequestHistoryDialog({
  request,
  open,
  onOpenChange,
}: LeaveRequestHistoryDialogProps) {
  const [history, setHistory] = useState<LeaveRequestHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && request) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [open, request]);

  const loadHistory = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const historyData = await getLeaveRequestHistory(request.id);
      setHistory(historyData);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "submitted":
        return "Soumis";
      case "approved":
        return "Approuvé";
      case "rejected":
        return "Rejeté";
      case "status_changed":
        return "Statut modifié";
      default:
        return action;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending Supervisor":
        return "En attente du superviseur";
      case "Pending Manager":
        return "En attente du manager";
      case "Pending HR":
        return "En attente des RH";
      case "Approved":
        return "Approuvé";
      case "Rejected":
        return "Rejeté";
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approuvé</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      case "Pending Supervisor":
        return <Badge variant="secondary" className="bg-yellow-400 text-black">En attente superviseur</Badge>;
      case "Pending Manager":
        return <Badge variant="secondary" className="bg-orange-400 text-black">En attente manager</Badge>;
      case "Pending HR":
        return <Badge variant="secondary" className="bg-orange-400 text-black">En attente RH</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "submitted":
        return <FileText className="h-4 w-4" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "status_changed":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historique de la demande de congé</DialogTitle>
          <DialogDescription>
            Détails des différentes étapes de traitement de cette demande
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun historique disponible pour cette demande
              </div>
            ) : (
              <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{getActionLabel(entry.action)}</p>
                          <p className="text-sm text-muted-foreground">
                            par {entry.actorName} ({entry.actorRole})
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(entry.status)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(entry.timestamp, "PPP 'à' HH:mm")}
                          </p>
                        </div>
                      </div>
                      {entry.previousStatus && entry.previousStatus !== entry.status && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Statut précédent:</span> {getStatusLabel(entry.previousStatus)}
                        </div>
                      )}
                      {entry.comment && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Commentaire:</p>
                          <p className="text-sm">{entry.comment}</p>
                        </div>
                      )}
                      {entry.reason && (
                        <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
                          <p className="text-sm font-medium mb-1 text-destructive">Raison du rejet:</p>
                          <p className="text-sm">{entry.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < history.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

