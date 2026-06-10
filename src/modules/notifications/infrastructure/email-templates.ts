function baseHtml(body: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px 32px 0;">
          <table role="presentation" width="100%">
            <tr>
              <td style="font-size:22px;font-weight:700;color:#1e3a5f;">SocioTech</td>
              <td align="right" style="font-size:12px;color:#94a3b8;">Salud & Bienestar</td>
            </tr>
          </table>
          <hr style="border:none;border-top:2px solid #e8edf4;margin:20px 0;">
        </td></tr>
        <tr><td style="padding:0 32px;">
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <hr style="border:none;border-top:1px solid #e8edf4;margin:0 0 16px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            SocioTech &mdash; Plataforma de Gestión de Salud<br>
            Si tienes dudas, responde a este correo o contáctanos en <a href="mailto:soporte@sociotech.dev" style="color:#2563eb;text-decoration:none;">soporte@sociotech.dev</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function emailVerificationCode(params: {
  name: string;
  code: string;
  expiresInMinutes: number;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Verifica tu correo</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.name}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">
      Este es tu código de verificación para continuar con el registro en SocioTech:
    </p>
    <div style="background-color:#f0f5ff;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1e3a5f;font-family:monospace;">${params.code}</span>
    </div>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Este código expira en <strong>${params.expiresInMinutes} minutos</strong>.</p>
    <p style="margin:0;font-size:13px;color:#64748b;">Si no solicitaste este código, ignora este mensaje.</p>
  `;
  return {
    subject: 'Tu código de verificación — SocioTech',
    html: baseHtml(body),
  };
}

export function userRegistered(params: { name: string }): {
  subject: string;
  html: string;
} {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Bienvenido a SocioTech</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.name}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">
      Tu cuenta ha sido creada exitosamente. Ya puedes acceder a la plataforma para gestionar tus citas médicas.
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Con tu cuenta puedes:</p>
    <ul style="margin:0 0 20px;font-size:13px;color:#475569;padding-left:20px;">
      <li style="margin-bottom:4px;">Agendar y gestionar citas médicas</li>
      <li style="margin-bottom:4px;">Ver tu historial de consultas</li>
      <li style="margin-bottom:4px;">Recibir recordatorios de tus citas</li>
    </ul>
  `;
  return { subject: 'Bienvenido a SocioTech', html: baseHtml(body) };
}

export function appointmentScheduledForPatient(params: {
  patientName: string;
  doctorName: string;
  serviceName: string;
  date: string;
  time: string;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#2563eb;">Cita Agendada</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">Tu cita ha sido agendada exitosamente y está <strong>pendiente de confirmación</strong> por el doctor.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px;">
        <table role="presentation" width="100%">
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:90px;">Doctor</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.doctorName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Servicio</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.serviceName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.date}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Hora</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.time}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">Te notificaremos cuando el doctor confirme tu cita.</p>
  `;
  return { subject: `Cita Agendada — ${params.date}`, html: baseHtml(body) };
}

export function appointmentScheduledForDoctor(params: {
  doctorName: string;
  patientName: string;
  serviceName: string;
  date: string;
  time: string;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#2563eb;">Nueva Cita Agendada</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola Dr. <strong>${params.doctorName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">El paciente <strong>${params.patientName}</strong> ha agendado una nueva cita contigo. Está pendiente de tu confirmación.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px;">
        <table role="presentation" width="100%">
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:90px;">Paciente</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.patientName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Servicio</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.serviceName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.date}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Hora</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.time}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">Puedes confirmar o reprogramar esta cita desde la plataforma.</p>
  `;
  return {
    subject: `Nueva cita — ${params.patientName} — ${params.date}`,
    html: baseHtml(body),
  };
}

export function appointmentConfirmed(params: {
  patientName: string;
  doctorName: string;
  serviceName: string;
  date: string;
  time: string;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Cita Confirmada</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">Tu cita ha sido confirmada exitosamente. Aquí están los detalles:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px;">
        <table role="presentation" width="100%">
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:90px;">Doctor</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.doctorName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Servicio</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.serviceName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.date}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Hora</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.time}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">Por favor llega <strong>15 minutos antes</strong> de tu cita. Si necesitas cancelar o reagendar, hazlo con al menos 2 horas de anticipación.</p>
  `;
  return { subject: `Cita Confirmada — ${params.date}`, html: baseHtml(body) };
}

export function appointmentConfirmedForDoctor(params: {
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#059669;">Cita Confirmada por el Paciente</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola Dr. <strong>${params.doctorName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">El paciente <strong>${params.patientName}</strong> ha confirmado la cita del <strong>${params.date}</strong> a las <strong>${params.time}</strong>.</p>
    <p style="margin:0;font-size:13px;color:#64748b;">La cita está confirmada y lista para atenderse.</p>
  `;
  return {
    subject: `Cita confirmada — ${params.patientName} — ${params.date}`,
    html: baseHtml(body),
  };
}

export function appointmentCancelled(params: {
  patientName: string;
  doctorName: string;
  date: string;
  reason?: string;
  cancelledByDoctor?: boolean;
}): { subject: string; html: string } {
  const byDoctor = params.cancelledByDoctor;
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#dc2626;">Cita Cancelada</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">
      Tu cita con el Dr. ${params.doctorName} del <strong>${params.date}</strong> ha sido cancelada${byDoctor ? ' por el doctor' : ''}.
    </p>
    ${params.reason ? `<div style="background-color:#fef2f2;border-radius:8px;padding:12px 16px;margin-bottom:16px;"><p style="margin:0;font-size:13px;color:#991b1b;"><strong>Motivo:</strong> ${params.reason}</p></div>` : ''}
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Si deseas agendar una nueva cita, puedes hacerlo a través de la plataforma.</p>
  `;
  return { subject: `Cita Cancelada — ${params.date}`, html: baseHtml(body) };
}

export function appointmentCancelledForDoctor(params: {
  doctorName: string;
  patientName: string;
  date: string;
  reason?: string;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#dc2626;">Cita Cancelada por el Paciente</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola Dr. <strong>${params.doctorName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">El paciente <strong>${params.patientName}</strong> ha cancelado la cita del <strong>${params.date}</strong>.</p>
    ${params.reason ? `<div style="background-color:#fef2f2;border-radius:8px;padding:12px 16px;margin-bottom:16px;"><p style="margin:0;font-size:13px;color:#991b1b;"><strong>Motivo:</strong> ${params.reason}</p></div>` : ''}
    <p style="margin:0;font-size:13px;color:#64748b;">El horario queda disponible para otros pacientes.</p>
  `;
  return {
    subject: `Cita cancelada — ${params.patientName} — ${params.date}`,
    html: baseHtml(body),
  };
}

export function loginDetected(params: {
  name: string;
  email: string;
  time: string;
  ip?: string;
  device?: string;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Nuevo inicio de sesión</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.name}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">
      Se ha detectado un inicio de sesión en tu cuenta de SocioTech:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:16px;">
      <tr><td style="padding:16px;">
        <table role="presentation" width="100%">
          <tr><td style="padding:4px 0;font-size:13px;color:#64748b;width:70px;">Fecha</td><td style="padding:4px 0;font-size:14px;color:#1e293b;">${params.time}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Cuenta</td><td style="padding:4px 0;font-size:14px;color:#1e293b;">${params.email}</td></tr>
          ${params.ip ? `<tr><td style="padding:4px 0;font-size:13px;color:#64748b;">IP</td><td style="padding:4px 0;font-size:14px;color:#1e293b;">${params.ip}</td></tr>` : ''}
          ${params.device ? `<tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Dispositivo</td><td style="padding:4px 0;font-size:14px;color:#1e293b;">${params.device}</td></tr>` : ''}
        </table>
      </td></tr>
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Si fuiste tú, puedes ignorar este mensaje.</p>
    <p style="margin:0;font-size:13px;color:#dc2626;">Si NO fuiste tú, cambia tu contraseña inmediatamente.</p>
  `;
  return {
    subject: 'Nuevo inicio de sesión — SocioTech',
    html: baseHtml(body),
  };
}

export function passwordChanged(params: { name: string; time: string }): {
  subject: string;
  html: string;
} {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Contraseña actualizada</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.name}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">
      La contraseña de tu cuenta de SocioTech ha sido cambiada exitosamente el <strong>${params.time}</strong>.
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Si realizaste este cambio, no necesitas hacer nada más.</p>
    <p style="margin:0;font-size:13px;color:#dc2626;">Si NO realizaste este cambio, contacta a soporte inmediatamente.</p>
  `;
  return {
    subject: 'Contraseña actualizada — SocioTech',
    html: baseHtml(body),
  };
}

export function appointmentCompleted(params: {
  patientName: string;
  doctorName: string;
  serviceName: string;
  date: string;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#059669;">Cita Completada</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">Tu cita ha sido completada. Gracias por confiar en SocioTech.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px;">
        <table role="presentation" width="100%">
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:90px;">Doctor</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.doctorName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Servicio</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.serviceName}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha</td><td style="padding:6px 0;font-size:14px;color:#1e293b;">${params.date}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">Puedes ver los detalles de tu consulta en la sección de historial de la plataforma.</p>
  `;
  return { subject: `Cita Completada — ${params.date}`, html: baseHtml(body) };
}

export function appointmentRescheduled(params: {
  patientName: string;
  doctorName: string;
  oldDate: string;
  newDate: string;
  newTime: string;
  isDoctorNotification?: boolean;
}): { subject: string; html: string } {
  if (params.isDoctorNotification) {
    const body = `
      <h1 style="margin:0 0 8px;font-size:20px;color:#d97706;">Cita Reagendada por el Paciente</h1>
      <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola Dr. <strong>${params.doctorName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">El paciente <strong>${params.patientName}</strong> ha reagendado su cita:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:20px;">
        <tr><td style="padding:16px;">
          <table role="presentation" width="100%">
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;">Fecha anterior</td><td style="padding:6px 0;font-size:14px;color:#94a3b8;text-decoration:line-through;">${params.oldDate}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Nueva fecha</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.newDate}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Nueva hora</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.newTime}</td></tr>
          </table>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#64748b;">Puedes revisar los detalles desde la plataforma.</p>
    `;
    return {
      subject: `Cita reagendada — ${params.patientName} — ${params.newDate}`,
      html: baseHtml(body),
    };
  }

  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#d97706;">Cita Reagendada</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.patientName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">Tu cita con el Dr. ${params.doctorName} ha sido reagendada:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px;">
        <table role="presentation" width="100%">
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;">Fecha anterior</td><td style="padding:6px 0;font-size:14px;color:#94a3b8;text-decoration:line-through;">${params.oldDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Nueva fecha</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.newDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Nueva hora</td><td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:600;">${params.newTime}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">Por favor llega <strong>15 minutos antes</strong> de tu cita.</p>
  `;
  return {
    subject: `Cita Reagendada — ${params.newDate}`,
    html: baseHtml(body),
  };
}

export function passwordReset(params: {
  name: string;
  code: string;
  expiresInMinutes: number;
}): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#dc2626;">Restablecer contraseña</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.5;">Hola <strong>${params.name}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.5;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código:
    </p>
    <div style="background-color:#fef2f2;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#991b1b;font-family:monospace;">${params.code}</span>
    </div>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Este código expira en <strong>${params.expiresInMinutes} minutos</strong>.</p>
    <p style="margin:0;font-size:13px;color:#64748b;">Si no solicitaste este cambio, ignora este mensaje.</p>
  `;
  return {
    subject: 'Restablece tu contraseña — SocioTech',
    html: baseHtml(body),
  };
}
