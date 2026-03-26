import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();

  const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", //"smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, //"yvonflouralvin@gmail.com",//process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS//"wnop mvgi ssvw vmec"//process.env.EMAIL_PASS,
  },
});

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  });

  return Response.json({ success: true });
}