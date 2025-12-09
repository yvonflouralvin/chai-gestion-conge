
import type { EmployeeWithCurrentContract, LeaveRequest, LeaveType } from "@/types";
import { format } from "date-fns";
import { getEmployeeById, getEmployeesByRole, getManager } from "./employee";
import { calculateLeaveDays } from "./utils";

// This is a mock email service. In a real application, you would use a
// service like SendGrid, Mailgun, or Firebase Extensions to send emails.
// The functions here log to the console to simulate sending an email.

type EmailDetails = {
    to: string;
    subject: string;
    body: string;
}

async function sendEmail(details: EmailDetails) {
    console.log("--- Sending Email ---");
    console.log(`To: ${details.to}`);
    // console.log(`To: ${details.to}`);
    console.log(`Subject: ${details.subject}`);
    console.log("Body:");
    console.log(details.body);
    console.log("---------------------");
    // In a real app, you would have your email sending logic here.
    // Example:
    // await sendgrid.send({ to: details.to, from: 'noreply@yourcompany.com', subject: details.subject, html: details.body });
}

/**
 * Generate a detailed HTML body for leave request emails with all information
 */
function generateLeaveRequestDetailsHtml(
    request: LeaveRequest,
    employee: EmployeeWithCurrentContract,
    leaveTypes: LeaveType[]
): string {
    const leaveType = leaveTypes.find(lt => lt.id === request.leaveTypeId);
    const leaveTypeName = leaveType?.name || 'Unknown';
    const circumstanceType = request.circumstanceType ? ` (${request.circumstanceType})` : '';
    const fullLeaveTypeName = leaveTypeName + circumstanceType;
    
    const formattedStartDate = format(request.startDate, "PPP");
    const formattedEndDate = format(request.endDate, "PPP");
    const formattedSubmissionDate = format(request.submissionDate, "PPP");
    const totalDays = calculateLeaveDays(request.startDate, request.endDate);
    
    let detailsHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2563eb;">Détails de la demande de congé</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 200px;">Employé:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${employee.name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Type de congé:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${fullLeaveTypeName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Date de début:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formattedStartDate}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Date de fin:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formattedEndDate}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nombre de jours:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${totalDays} jour(s)</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Date de soumission:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formattedSubmissionDate}</td>
                </tr>
    `;
    
    if (request.documentUrl) {
        detailsHtml += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Document:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="${request.documentUrl}" target="_blank">Voir le document</a></td>
                </tr>
        `;
    }
    
    detailsHtml += `
            </table>
    `;
    
    return detailsHtml;
}

// --- Email for new request submitted ---
type SubmittedEmailProps = {
    request: LeaveRequest;
    employee: EmployeeWithCurrentContract;
    leaveTypes: LeaveType[];
}
export async function sendLeaveRequestSubmittedEmail(props: SubmittedEmailProps) {
    const { request, employee, leaveTypes } = props;

    // If request goes directly to HR (leaveTypeId === 4), notify HR
    if (request.status === 'Pending HR') {
        const hrEmployees = await getEmployeesByRole('HR');
        if (hrEmployees.length > 0) {
            const detailsHtml = generateLeaveRequestDetailsHtml(request, employee, leaveTypes);
            for (const hr of hrEmployees) {
                const subject = `Nouvelle demande de congé de ${employee.name}`;
                const body = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <p>Bonjour ${hr.name},</p>
                        <p>${employee.name} a soumis une nouvelle demande de congé qui nécessite votre approbation.</p>
                        ${detailsHtml}
                        <p style="margin-top: 20px;">Vous pouvez examiner cette demande dans le tableau de bord EasyLeave.</p>
                    </div>
                `;
                await sendEmail({ to: hr.email, subject, body });
            }
        }
        return;
    }

    // Otherwise, notify supervisor
    if (!employee.supervisorId) {
        console.log(`Employee ${employee.name} has no supervisor. No email sent.`);
        return;
    }

    const supervisor = await getEmployeeById(employee.supervisorId as string);
    if (!supervisor) {
        console.error(`Supervisor with id ${employee.supervisorId} not found.`);
        return;
    }
    
    const detailsHtml = generateLeaveRequestDetailsHtml(request, employee, leaveTypes);
    const subject = `Nouvelle demande de congé de ${employee.name}`;
    const body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Bonjour ${supervisor.name},</p>
            <p>${employee.name} a soumis une nouvelle demande de congé qui nécessite votre approbation.</p>
            ${detailsHtml}
            <p style="margin-top: 20px;">Vous pouvez examiner cette demande dans le tableau de bord EasyLeave.</p>
        </div>
    `;

    await sendEmail({ to: supervisor.email, subject, body });
}


// --- Email for when a request is updated (approved/rejected) ---
type UpdatedEmailProps = {
    request: LeaveRequest;
    actor: EmployeeWithCurrentContract; // The person who made the change (HR, supervisor, or manager)
    leaveTypes: LeaveType[];
}

export async function sendLeaveRequestUpdatedEmail(props: UpdatedEmailProps) {
    const { request, actor, leaveTypes } = props;

    const employee = await getEmployeeById(request.employeeId);
    if (!employee) {
        console.error(`Employee with id ${request.employeeId} not found for email notification.`);
        return;
    }

    const detailsHtml = generateLeaveRequestDetailsHtml(request, employee, leaveTypes);
    const actorRole = actor.role === 'HR' ? 'RH' : actor.role === 'Supervisor' ? 'Superviseur' : actor.role === 'Manager' ? 'Manager' : actor.role;

    // Build comments section with all comments from the approval chain
    let commentsHtml = '';
    if (request.comment) {
        commentsHtml += `
            <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #1e40af;">Commentaire de ${actor.name} (${actorRole}):</p>
                <p style="margin: 5px 0 0 0;">${request.comment}</p>
            </div>
        `;
    }

    // Scenario 1: HR approves, notify Supervisor
    if (request.status === 'Pending Supervisor') {
        if (!employee.supervisorId) {
            console.log(`Employee ${employee.name} has no supervisor. No email sent.`);
            return;
        }

        const supervisor = await getEmployeeById(employee.supervisorId);
        if (supervisor) {
            const subject = `Demande de congé de ${employee.name} - Approbation requise`;
            const body = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Bonjour ${supervisor.name},</p>
                    <p>Une demande de congé de ${employee.name} a été approuvée par ${actor.name} (${actorRole}) et nécessite maintenant votre approbation.</p>
                    ${detailsHtml}
                    ${commentsHtml}
                    <p style="margin-top: 20px;">Vous pouvez examiner et approuver cette demande dans le tableau de bord EasyLeave.</p>
                </div>
            `;
            await sendEmail({ to: supervisor.email, subject, body });
        }

        // Notify employee
        const employeeSubject = `Mise à jour sur votre demande de congé`;
        const employeeBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <p>Bonjour ${employee.name},</p>
                <p>Votre demande de congé a été approuvée par ${actor.name} (${actorRole}) et est maintenant en attente d'approbation de votre superviseur.</p>
                ${detailsHtml}
                ${commentsHtml}
            </div>
        `;
        await sendEmail({ to: employee.email, subject: employeeSubject, body: employeeBody });
    }

    // Scenario 2: Supervisor approves, notify Manager
    if (request.status === 'Pending Manager') {
        const manager = await getManager();
        
        if (manager) {
            const subject = `Demande de congé de ${employee.name} - Approbation requise`;
            const body = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Bonjour ${manager.name},</p>
                    <p>Une demande de congé de ${employee.name} a été approuvée par ${actor.name} (${actorRole}) et nécessite maintenant votre approbation finale.</p>
                    ${detailsHtml}
                    ${commentsHtml}
                    <p style="margin-top: 20px;">Vous pouvez examiner et approuver cette demande dans le tableau de bord EasyLeave.</p>
                </div>
            `;
            await sendEmail({ to: manager.email, subject, body });
        }

        // Notify employee
        const employeeSubject = `Mise à jour sur votre demande de congé`;
        const employeeBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <p>Bonjour ${employee.name},</p>
                <p>Votre demande de congé a été approuvée par ${actor.name} (${actorRole}) et est maintenant en attente d'approbation finale du manager.</p>
                ${detailsHtml}
                ${commentsHtml}
            </div>
        `;
        await sendEmail({ to: employee.email, subject: employeeSubject, body: employeeBody });
    }

    // Scenario 3: Manager gives final approval, notify Employee
    if (request.status === 'Approved') {
        const subject = `Votre demande de congé a été approuvée`;
        const body = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <p>Bonjour ${employee.name},</p>
                <p style="color: #059669; font-weight: bold;">Félicitations ! Votre demande de congé a été entièrement approuvée par ${actor.name} (${actorRole}).</p>
                ${detailsHtml}
                ${commentsHtml}
                <p style="margin-top: 20px; color: #059669;">Vous pouvez maintenant planifier votre congé en toute sérénité.</p>
            </div>
        `;
        await sendEmail({ to: employee.email, subject, body });
    }

    // Scenario 4: Request is rejected, notify Employee
    if (request.status === 'Rejected') {
        const reason = request.supervisorReason || request.managerReason || "Aucune raison fournie.";
        const subject = `Votre demande de congé a été rejetée`;
        const body = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <p>Bonjour ${employee.name},</p>
                <p style="color: #dc2626;">Malheureusement, votre demande de congé a été rejetée par ${actor.name} (${actorRole}).</p>
                ${detailsHtml}
                <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #991b1b;">Raison du rejet:</p>
                    <p style="margin: 5px 0 0 0;">${reason}</p>
                </div>
                ${commentsHtml}
                <p style="margin-top: 20px;">Si vous avez des questions, veuillez contacter ${actor.name}.</p>
            </div>
        `;
        await sendEmail({ to: employee.email, subject, body });
    }
}
