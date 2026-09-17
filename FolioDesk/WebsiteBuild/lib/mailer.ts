// T-510 follow-on fix (new finding, not in the original three items): the
// forgot-password flow previously accepted an email + new password with zero
// identity verification -- anyone who knew a user's email could take over
// their account. This delivers a single-use reset token by email via AWS
// SES so only the inbox owner can complete a reset.
//
// NOTE: SES needs real AWS credentials, separate from the SPACES_* variables
// lib/storage.ts uses for DigitalOcean Spaces (DO Spaces credentials are
// DO's own tokens and are NOT valid for AWS SES, even though both are
// S3-compatible APIs). Configure AWS_REGION, AWS_ACCESS_KEY_ID,
// AWS_SECRET_ACCESS_KEY (or rely on the default AWS credential chain, e.g.
// an IAM role) and MAIL_FROM_ADDRESS (must be a verified SES sender/domain).
//
// When those aren't configured (e.g. local dev), sends fall back to a
// console log of the email content instead of throwing, so the reset flow
// stays fully testable without provisioning SES first.
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

let sesClient: SESv2Client | undefined;

function sesConfigured(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || Boolean(process.env.AWS_REGION);
}

function getSesClient(): SESv2Client {
  if (!sesClient) {
    sesClient = new SESv2Client({
      region: process.env.AWS_REGION || "ap-southeast-1",
    });
  }
  return sesClient;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<void> {
  const from = process.env.MAIL_FROM_ADDRESS;

  if (!sesConfigured() || !from) {
    console.warn(
      `[mailer] SES not configured (AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/MAIL_FROM_ADDRESS) -- logging email instead of sending.\n` +
        `  To: ${to}\n  Subject: ${subject}\n  Body:\n${text}`
    );
    return;
  }

  const client = getSesClient();
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: text, Charset: "UTF-8" },
            ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
          },
        },
      },
    })
  );
}
