
import type { EmployeeWithCurrentContract, LeaveRequest, LeaveType } from "@/types";
import { format } from "date-fns";
import { getEmployeeById } from "./employee";

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
    console.log(`Subject: ${details.subject}`);
    console.log("Body:");
    console.log(details.body);
    console.log("---------------------");
    // In a real app, you would have your email sending logic here.
    // Example:
    // await sendgrid.send({ to: details.to, from: 'noreply@yourcompany.com', subject: details.subject, html: details.body });
}

// --- Email for new request submitted ---
type SubmittedEmailProps = {
    request: LeaveRequest;
    employee: EmployeeWithCurrentContract;
    leaveTypes: LeaveType[];
}
export async function sendLeaveRequestSubmittedEmail(props: SubmittedEmailProps) {
    const { request, employee, leaveTypes } = props;

    if (!employee.supervisorId) {
        console.log(`Employee ${employee.name} has no supervisor. No email sent.`);
        return;
    }

    const supervisor = await getEmployeeById(employee.supervisorId as string);
    if (!supervisor) {
        console.error(`Supervisor with id ${employee.supervisorId} not found.`);
        return;
    }
    
    const leaveTypeName = leaveTypes.find(lt => lt.id === request.leaveTypeId)?.name || 'Unknown';
    const formattedStartDate = format(request.startDate, "PPP");
    const formattedEndDate = format(request.endDate, "PPP");

    const subject = `New Leave Request from ${employee.name}`;
    const body = `
        <p>Hello ${supervisor.name},</p>
        <p>${employee.name} has submitted a new leave request for your approval.</p>
        <ul>
            <li><strong>Type:</strong> ${leaveTypeName}</li>
            <li><strong>Start Date:</strong> ${formattedStartDate}</li>
            <li><strong>End Date:</strong> ${formattedEndDate}</li>
        </ul>
        <p>You can review this request in the EasyLeave dashboard.</p>
    `;

    await sendEmail({ to: supervisor.email, subject, body });
}


// --- Email for when a request is updated (approved/rejected) ---
type UpdatedEmailProps = {
    request: LeaveRequest;
    actor: EmployeeWithCurrentContract; // The person who made the change (supervisor or manager)
    leaveTypes: LeaveType[];
}

export async function sendLeaveRequestUpdatedEmail(props: UpdatedEmailProps) {
    const { request, actor, leaveTypes } = props;

    const employee = await getEmployeeById(request.employeeId);
    if (!employee) {
        console.error(`Employee with id ${request.employeeId} not found for email notification.`);
        return;
    }

    const leaveTypeName = leaveTypes.find(lt => lt.id === request.leaveTypeId)?.name || 'Unknown';
    const formattedStartDate = format(request.startDate, "PPP");
    const formattedEndDate = format(request.endDate, "PPP");

    const approvalCommentHtml = request.comment ? `<p><strong>Comment from ${actor.name}:</strong> ${request.comment}</p>` : '';

    // Scenario 1: Supervisor approves, notify Manager
    if (request.status === 'Pending Manager') {
        const managerQuery = (await getDocs(query(collection(db, "users"), where("role", "==", "Manager"))));
        const managerDoc = managerQuery.docs[0];
        
        if (managerDoc) {
            const manager = processEmployee(managerDoc.data(), managerDoc.id);
            const subject = `Leave Request for ${employee.name} needs your approval`;
            const body = `
                <p>Hello ${manager.name},</p>
                <p>A leave request from ${employee.name} has been approved by their supervisor, ${actor.name}, and is now awaiting your final approval.</p>
                <ul>
                    <li><strong>Type:</strong> ${leaveTypeName}</li>
                    <li><strong>Start Date:</strong> ${formattedStartDate}</li>
                    <li><strong>End Date:</strong> ${formattedEndDate}</li>
                </ul>
                ${approvalCommentHtml}
            `;
            await sendEmail({ to: manager.email, subject, body });
        }


        // Also notify the employee of the progress
        const employeeSubject = `Update on your leave request`;
        const employeeBody = `<p>Hello ${employee.name},</p><p>Your leave request has been approved by your supervisor and is now pending final approval from the manager.</p>${approvalCommentHtml}`;
        await sendEmail({ to: employee.email, subject: employeeSubject, body: employeeBody });
    }

    // Scenario 2: Manager gives final approval, notify Employee
    if (request.status === 'Approved') {
        const subject = `Your leave request has been approved`;
        const body = `
            <p>Hello ${employee.name},</p>
            <p>Your leave request has been fully approved.</p>
             <ul>
                <li><strong>Type:</strong> ${leaveTypeName}</li>
                <li><strong>Start Date:</strong> ${formattedStartDate}</li>
                <li><strong>End Date:</strong> ${formattedEndDate}</li>
            </ul>
             ${approvalCommentHtml}
        `;
        await sendEmail({ to: employee.email, subject, body });
    }

    // Scenario 3: Request is rejected, notify Employee
    if (request.status === 'Rejected') {
        const reason = request.supervisorReason || request.managerReason || "No reason provided.";
        const subject = `Your leave request has been rejected`;
        const body = `
            <p>Hello ${employee.name},</p>
            <p>Unfortunately, your recent leave request has been rejected by ${actor.name}.</p>
            <p><strong>Reason:</strong> ${reason}</p>
        `;
        await sendEmail({ to: employee.email, subject, body });
    }
}
