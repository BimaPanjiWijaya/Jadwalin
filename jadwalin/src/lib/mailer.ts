import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBookingConfirmationEmail(
  to: string,
  data: {
    customerName: string;
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
    bookingCode: string;
  },
) {
  await transporter.sendMail({
    from: `"Jadwalin" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Booking dikonfirmasi - ${data.businessName}`,
    html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Booking kamu berhasil!</h2>
        <p>Halo ${data.customerName},</p>
        <p>Booking kamu di <strong>${data.businessName}</strong> sudah dikonfirmasi.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="padding:8px;color:#666;">Layanan</td><td style="padding:8px;">${data.serviceName}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Tanggal</td><td style="padding:8px;">${data.date}</td></tr>
          <tr><td style="padding:8px;color:#666;">Waktu</td><td style="padding:8px;">${data.time}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Kode booking</td><td style="padding:8px;font-weight:bold;">${data.bookingCode}</td></tr>
        </table>
        <p style="margin-top:24px;">Sampai jumpa!</p>
        <p style="color:#999;font-size:12px;">— Tim Jadwalin</p>
      </div>    
    `,
  });
}
