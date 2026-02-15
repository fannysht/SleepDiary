import nodemailer from "nodemailer";

const sendOTPEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"Sleep Diary" <no-reply@spleepdiary.com>',
    to: email,
    subject: "Votre code de récupération",
    html: `
      <div style="font-family: 'Georgia', serif; background-color: #f8fafc; padding: 40px; color: #1a1a2e; border: 1px solid #18548f;">
        <h2 style="color: #1a1a2e; text-align: center;">Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre accès. Voici votre code de validation unique :</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #003262; background: #ffffff; padding: 15px 30px; border: 1px solid #18548f; border-radius: 8px;">
            ${code}
          </span>
        </div>
        <p style="font-size: 14px; color: #64748b; font-style: italic;">
          Ce code est valide pendant 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #18548f; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">© 2026 Votre Agenda du sommeil</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export default sendOTPEmail;