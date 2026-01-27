"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Users, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CalendarCheck,
  CalendarX
} from "lucide-react";
import type { LeaveRequest, EmployeeWithCurrentContract } from "@/types";
import { calculateLeaveDays } from "@/lib/utils";

type DashboardProps = {
  leaveRequests: LeaveRequest[];
  employees: EmployeeWithCurrentContract[];
  currentUser: EmployeeWithCurrentContract;
};

export function Dashboard({ leaveRequests, employees, currentUser }: DashboardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = useMemo(() => {
    // Filtrage des demandes selon le rôle
    let filteredRequests = leaveRequests;
    
    if (currentUser.role === "Manager") {
      // Manager voit les demandes de son équipe
      const teamEmployeeIds = employees
        .filter(emp => emp.supervisorId === currentUser.id || emp.id === currentUser.id)
        .map(emp => emp.id);
      filteredRequests = leaveRequests.filter(req => teamEmployeeIds.includes(req.employeeId));
    } else if (currentUser.role === "Supervisor") {
      // Supervisor voit les demandes de son équipe
      const teamEmployeeIds = employees
        .filter(emp => emp.supervisorId === currentUser.id || emp.id === currentUser.id)
        .map(emp => emp.id);
      filteredRequests = leaveRequests.filter(req => teamEmployeeIds.includes(req.employeeId));
    }
    // HR et Admin voient toutes les demandes

    // Statistiques de base
    const totalRequests = filteredRequests.length;
    const approvedRequests = filteredRequests.filter(r => r.status === "Approved");
    const rejectedRequests = filteredRequests.filter(r => r.status === "Rejected");
    const pendingRequests = filteredRequests.filter(r => 
      r.status === "Pending Supervisor" || 
      r.status === "Pending Manager" || 
      r.status === "Pending HR"
    );
    const pendingSupervisor = filteredRequests.filter(r => r.status === "Pending Supervisor");
    const pendingManager = filteredRequests.filter(r => r.status === "Pending Manager");
    const pendingHR = filteredRequests.filter(r => r.status === "Pending HR");

    // Congés consommés (approuvés avec date passée ou en cours)
    const consumedLeaves = approvedRequests.filter(r => {
      const endDate = new Date(r.endDate);
      endDate.setHours(23, 59, 59, 999);
      return endDate < today || (r.startDate <= today && r.endDate >= today);
    });

    // Demandes non débutées (approuvées mais date future)
    const notStartedRequests = approvedRequests.filter(r => {
      const startDate = new Date(r.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate > today;
    });

    // Calcul des jours de congé consommés
    const totalConsumedDays = consumedLeaves.reduce((sum, req) => {
      return sum + calculateLeaveDays(req.startDate, req.endDate);
    }, 0);

    // Calcul des jours de congé planifiés (non débutés)
    const totalPlannedDays = notStartedRequests.reduce((sum, req) => {
      return sum + calculateLeaveDays(req.startDate, req.endDate);
    }, 0);

    // Taux d'approbation
    const processedRequests = approvedRequests.length + rejectedRequests.length;
    const approvalRate = processedRequests > 0 
      ? ((approvedRequests.length / processedRequests) * 100).toFixed(1)
      : "0";

    // Demandes en cours (dates entre aujourd'hui)
    const ongoingRequests = approvedRequests.filter(r => {
      const start = new Date(r.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(r.endDate);
      end.setHours(23, 59, 59, 999);
      return start <= today && end >= today;
    });

    // Demandes ce mois
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const requestsThisMonth = filteredRequests.filter(r => {
      const submissionDate = new Date(r.submissionDate);
      return submissionDate.getMonth() === currentMonth && 
             submissionDate.getFullYear() === currentYear;
    });

    // Demandes urgentes (en attente depuis plus de 3 jours)
    const urgentRequests = pendingRequests.filter(r => {
      const submissionDate = new Date(r.submissionDate);
      const daysSinceSubmission = Math.floor((today.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceSubmission > 3;
    });

    return {
      totalRequests,
      approvedRequests: approvedRequests.length,
      rejectedRequests: rejectedRequests.length,
      pendingRequests: pendingRequests.length,
      pendingSupervisor: pendingSupervisor.length,
      pendingManager: pendingManager.length,
      pendingHR: pendingHR.length,
      consumedLeaves: consumedLeaves.length,
      notStartedRequests: notStartedRequests.length,
      totalConsumedDays,
      totalPlannedDays,
      approvalRate,
      ongoingRequests: ongoingRequests.length,
      requestsThisMonth: requestsThisMonth.length,
      urgentRequests: urgentRequests.length,
    };
  }, [leaveRequests, employees, currentUser]);

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend,
    variant = "default"
  }: {
    title: string;
    value: string | number;
    description?: string;
    icon: any;
    trend?: string;
    variant?: "default" | "success" | "danger" | "warning";
  }) => {
    const variantStyles = {
      default: "border-border",
      success: "border-green-500/50 bg-green-50 dark:bg-green-950/20",
      danger: "border-red-500/50 bg-red-50 dark:bg-red-950/20",
      warning: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20",
    };

    return (
      <Card className={variantStyles[variant]}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">
          Vue d'ensemble des demandes de congé et des statistiques
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total des demandes"
          value={stats.totalRequests}
          description="Toutes les demandes"
          icon={FileText}
        />
        <StatCard
          title="Demandes approuvées"
          value={stats.approvedRequests}
          description={`${stats.approvalRate}% de taux d'approbation`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Demandes rejetées"
          value={stats.rejectedRequests}
          description="Demandes refusées"
          icon={XCircle}
          variant="danger"
        />
        <StatCard
          title="En attente"
          value={stats.pendingRequests}
          description="Demandes en attente d'approbation"
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Détails des approbations en attente */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="En attente Superviseur"
          value={stats.pendingSupervisor}
          description="En attente d'approbation superviseur"
          icon={UserCheck}
          variant="warning"
        />
        <StatCard
          title="En attente Manager"
          value={stats.pendingManager}
          description="En attente d'approbation manager"
          icon={Users}
          variant="warning"
        />
        <StatCard
          title="En attente RH"
          value={stats.pendingHR}
          description="En attente d'approbation RH"
          icon={FileText}
          variant="warning"
        />
      </div>

      {/* Congés et planification */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Congés consommés"
          value={stats.consumedLeaves}
          description={`${stats.totalConsumedDays} jours de congé utilisés`}
          icon={CalendarCheck}
          variant="success"
        />
        <StatCard
          title="Demandes non débutées"
          value={stats.notStartedRequests}
          description={`${stats.totalPlannedDays} jours planifiés`}
          icon={CalendarX}
        />
        <StatCard
          title="Congés en cours"
          value={stats.ongoingRequests}
          description="Congés actuellement en cours"
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Demandes ce mois"
          value={stats.requestsThisMonth}
          description="Nouvelles demandes ce mois"
          icon={TrendingUp}
        />
      </div>

      {/* Alertes et informations importantes */}
      {stats.urgentRequests > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Demandes urgentes
            </CardTitle>
            <CardDescription>
              {stats.urgentRequests} demande(s) en attente depuis plus de 3 jours nécessitent une attention immédiate
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Résumé des statistiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Résumé des congés</CardTitle>
            <CardDescription>Vue d'ensemble de l'utilisation des congés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Jours consommés</span>
              <Badge variant="secondary" className="text-lg font-semibold">
                {stats.totalConsumedDays} jours
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Jours planifiés</span>
              <Badge variant="outline" className="text-lg font-semibold">
                {stats.totalPlannedDays} jours
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total jours approuvés</span>
              <Badge variant="default" className="text-lg font-semibold">
                {stats.totalConsumedDays + stats.totalPlannedDays} jours
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques d'approbation</CardTitle>
            <CardDescription>Performance du processus d'approbation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux d'approbation</span>
              <Badge variant="secondary" className="text-lg font-semibold">
                {stats.approvalRate}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Demandes traitées</span>
              <Badge variant="outline" className="text-lg font-semibold">
                {stats.approvedRequests + stats.rejectedRequests}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">En attente de traitement</span>
              <Badge variant="outline" className="text-lg font-semibold">
                {stats.pendingRequests}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

