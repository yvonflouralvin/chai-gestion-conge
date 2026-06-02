import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, //"smtp.gmail.com", // "smtp.hostinger.com", //"smtp.gmail.com",
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, //"yvonflouralvin@gmail.com",//process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS//"wnop mvgi ssvw vmec"//process.env.EMAIL_PASS,
    },
  });

  const result = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  });

  console.log(result)

  return Response.json({ success: true });
}