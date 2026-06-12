// 寄信抽象層。以 Resend HTTP API 實作(設定 RESEND_API_KEY 後啟用,免裝套件)。
// 未設定金鑰時:不丟錯,改在伺服器 log 印出內容,方便接信箱服務前先測流程。
// 若日後改用 SES / SMTP,只需替換此檔的 sendEmail 實作。
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "VEKTR <noreply@vektr.com.tw>";

  if (!key) {
    console.log(
      "[email] RESEND_API_KEY 未設定,僅記錄不寄送 →",
      JSON.stringify({ to: opts.to, subject: opts.subject })
    );
    console.log("[email] 內容:", opts.html);
    return { sent: false };
  }

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!r.ok) {
    throw new Error(`email send failed: ${r.status} ${await r.text()}`);
  }
  return { sent: true };
}
