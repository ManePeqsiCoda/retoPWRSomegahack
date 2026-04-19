import type { EmailSendResult, TipoEmail } from '@/types';
import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to:       string;
  toName?:  string;
  subject:  string;
  html:     string;
  text:     string;
  // Metadata para el registro en DuckDB (futuro)
  idTicket?:       string;
  numeroRadicado?: string;
  tipoEmail?:      TipoEmail;
}

export interface IEmailTransporter {
  send(options: EmailOptions): Promise<EmailSendResult>;
  verify(): Promise<boolean>;
}

/**
 * IMPLEMENTACIÓN 1: MockTransporter
 * Simula el envío (logs en consola, sin Nodemailer real)
 */
class MockTransporter implements IEmailTransporter {
  async send(options: EmailOptions): Promise<EmailSendResult> {
    const messageId = `<mock-${Date.now()}@crm-pqrsd.medellin.gov.co>`;

    // Log estructurado — visible en la terminal de Next.js durante la demo
    const separator = '═'.repeat(65);
    console.log(`\n${separator}`);
    console.log('📬  CRM PQRSD — EMAIL SIMULADO (SMTP_MODE=mock)');
    console.log(separator);
    console.log(`  ▶ Para:      ${options.toName ? `${options.toName} <${options.to}>` : options.to}`);
    console.log(`  ▶ Asunto:    ${options.subject}`);
    console.log(`  ▶ Radicado:  ${options.numeroRadicado ?? 'N/A'}`);
    console.log(`  ▶ Tipo:      ${options.tipoEmail ?? 'N/A'}`);
    console.log(`  ▶ Message-ID: ${messageId}`);
    console.log(`  ▶ Timestamp:  ${new Date().toISOString()}`);
    console.log(`${separator}\n`);

    // Simula latencia de red para que la UI muestre el spinner
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

    return {
      success:   true,
      messageId,
      simulado:  true,
      registro: {
        idRegistro:     `reg-mock-${Date.now()}`,
        idTicket:        options.idTicket        ?? '',
        numeroRadicado:  options.numeroRadicado  ?? '',
        tipoEmail:       options.tipoEmail       ?? 'confirmacion_radicado',
        destinatario:    options.to,
        asunto:          options.subject,
        fechaEnvio:      new Date().toISOString(),
        estado:          'simulado',
        messageId,
      },
    };
  }

  async verify(): Promise<boolean> {
    console.log('[MockTransporter] Conexión verificada (modo simulado)');
    return true;
  }
}

/**
 * IMPLEMENTACIÓN 2: NodemailerTransporter
 * Usa Nodemailer con las credenciales de Gmail configuradas
 */
class NodemailerTransporter implements IEmailTransporter {
  private transporter: Transporter;
  private from: string;

  constructor() {
    // Validar variables de entorno
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] as const;
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(
          `[EmailService] Falta la variable de entorno: ${key}. ` +
          `Configúrala en .env.local o usa SMTP_MODE=mock para desarrollo.`
        );
      }
    }

    this.from = `"${process.env.SMTP_FROM_NAME ?? 'Alcaldía de Medellín'}" ` +
                `<${process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER}>`;

    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST!,
      port:   parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      tls: {
        // En desarrollo con Gmail puede ser necesario
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  async send(options: EmailOptions): Promise<EmailSendResult> {
    try {
      const info = await this.transporter.sendMail({
        from:    this.from,
        to:      options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        subject: options.subject,
        html:    options.html,
        text:    options.text,
        headers: {
          'X-Mailer':           'CRM-PQRSD-MedellinGovTech/1.0',
          'X-Radicado-System':  'Distrito-CTI-Medellin',
          'X-Ticket-ID':        options.idTicket ?? '',
        },
      });

      console.log(`[EmailService] ✅ Email enviado → ${options.to} | ID: ${info.messageId}`);

      return {
        success:   true,
        messageId: info.messageId,
        simulado:  false,
        registro: {
          idRegistro:    `reg-${Date.now()}`,
          idTicket:       options.idTicket       ?? '',
          numeroRadicado: options.numeroRadicado ?? '',
          tipoEmail:      options.tipoEmail      ?? 'confirmacion_radicado',
          destinatario:   options.to,
          asunto:         options.subject,
          fechaEnvio:     new Date().toISOString(),
          estado:         'enviado',
          messageId:      info.messageId,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error SMTP desconocido';
      console.error(`[EmailService] ❌ Error → ${msg}`);
      return {
        success:  false,
        simulado: false,
        error:    msg,
        registro: {
          idRegistro:    `reg-err-${Date.now()}`,
          idTicket:       options.idTicket       ?? '',
          numeroRadicado: options.numeroRadicado ?? '',
          tipoEmail:      options.tipoEmail      ?? 'confirmacion_radicado',
          destinatario:   options.to,
          asunto:         options.subject,
          fechaEnvio:     new Date().toISOString(),
          estado:         'fallido',
          errorMensaje:   msg,
        },
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('[EmailService] ✅ Conexión SMTP verificada correctamente');
      return true;
    } catch (err) {
      console.error('[EmailService] ❌ Verificación SMTP fallida:', err);
      return false;
    }
  }
}

/**
 * FACTORY + SINGLETON
 * Crea el transporter correcto según SMTP_MODE.
 */
export function createEmailTransporter(): IEmailTransporter {
  const mode = process.env.SMTP_MODE ?? 'mock';
  if (mode === 'live') return new NodemailerTransporter();
  return new MockTransporter();
}

// Singleton — reutiliza la misma instancia entre requests de Next.js
let _instance: IEmailTransporter | null = null;

export function getEmailTransporter(): IEmailTransporter {
  if (!_instance) _instance = createEmailTransporter();
  return _instance;
}
