import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-ses";

const SETUP_INBOX = "rahul98@gmail.com";
const PLACEHOLDER_SECRET = /^\[(SENSITIVE|REDACTED)\]$/i;

export class SetupEmailError extends Error {
  readonly sesName: string;
  readonly sesCode: string;
  readonly httpStatus?: number;
  readonly clientHint: string;

  constructor(opts: {
    sesName: string;
    sesCode: string;
    httpStatus?: number;
    clientHint: string;
  }) {
    super("The setup email could not be sent. Please try again.");
    this.name = "SetupEmailError";
    this.sesName = opts.sesName;
    this.sesCode = opts.sesCode;
    this.httpStatus = opts.httpStatus;
    this.clientHint = opts.clientHint;
  }
}

export function setupInboxAddress() {
  return SETUP_INBOX;
}

export function setupFromAddress() {
  const from = process.env.SES_FROM_EMAIL?.trim() || "";
  if (!from || PLACEHOLDER_SECRET.test(from)) {
    return "alerts@mavex.live";
  }
  return from;
}

function readSecret(name: string) {
  const value = process.env[name]?.trim() || "";
  if (!value || PLACEHOLDER_SECRET.test(value)) {
    return "";
  }
  return value;
}

function getSesClient(): SESClient {
  const region = readSecret("AWS_REGION") || "us-east-1";
  const accessKeyId = readSecret("GOVT_AWS_ACCESS_KEY");
  const secretAccessKey = readSecret("GOVT_AWS_SECRET_ACCESS_KEY");
  const credentials =
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined;
  return new SESClient({
    region,
    ...(credentials ? { credentials } : {}),
  });
}

export function isSetupEmailConfigured() {
  return Boolean(
    readSecret("GOVT_AWS_ACCESS_KEY") && readSecret("GOVT_AWS_SECRET_ACCESS_KEY")
  );
}

function describeSesError(err: unknown) {
  const e = err as {
    name?: string;
    Code?: string;
    code?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number };
  };
  const sesName = String(e?.name || "Error");
  const sesCode = String(e?.Code || e?.code || sesName);
  const message = String(e?.message || "");
  const httpStatus = e?.$metadata?.httpStatusCode;
  const unverified =
    sesName === "MessageRejected" ||
    sesCode === "MessageRejected" ||
    /not verified/i.test(message) ||
    /sandbox/i.test(message);

  let clientHint =
    "The setup email could not be sent. Please try again.";
  if (unverified) {
    clientHint =
      "Amazon SES rejected the message. Sandbox accounts can only send to verified addresses — confirm the inbox is verified, or request production access.";
  }

  return { sesName, sesCode, httpStatus, message, clientHint };
}

function buildSendParams(input: {
  subject: string;
  text: string;
  replyTo: string;
  toAddresses: string[];
}): SendEmailCommandInput {
  const params: SendEmailCommandInput = {
    Source: setupFromAddress(),
    Destination: { ToAddresses: input.toAddresses },
    ReplyToAddresses: [input.replyTo],
    Message: {
      Subject: { Data: input.subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: input.text, Charset: "UTF-8" },
        Html: {
          Data: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(
            input.text
          )}</pre>`,
          Charset: "UTF-8",
        },
      },
    },
    Tags: [{ Name: "type", Value: "rsvpshare-setup" }],
  };

  const identityArn = readSecret("SES_IDENTITY_ARN");
  if (identityArn) {
    params.SourceArn = identityArn;
  }

  return params;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendSetupRequestEmail(input: {
  subject: string;
  text: string;
  replyTo: string;
}): Promise<void> {
  const from = setupFromAddress();
  const client = getSesClient();

  try {
    await client.send(
      new SendEmailCommand(
        buildSendParams({ ...input, toAddresses: [setupInboxAddress()] })
      )
    );
    return;
  } catch (err) {
    const info = describeSesError(err);
    console.error("setup email SES send failed", {
      name: info.sesName,
      code: info.sesCode,
      httpStatus: info.httpStatus,
      message: info.message,
      region: readSecret("AWS_REGION") || "us-east-1",
      fromSet: Boolean(setupFromAddress()),
      identityArnSet: Boolean(readSecret("SES_IDENTITY_ARN")),
    });

    const unverifiedRecipient =
      info.sesName === "MessageRejected" || info.sesCode === "MessageRejected";
    if (unverifiedRecipient && from.toLowerCase() !== setupInboxAddress().toLowerCase()) {
      try {
        await client.send(
          new SendEmailCommand(
            buildSendParams({ ...input, toAddresses: [from] })
          )
        );
        console.error(
          "setup email SES send succeeded on fallback to SES_FROM_EMAIL after MessageRejected"
        );
        return;
      } catch (fallbackErr) {
        const fallback = describeSesError(fallbackErr);
        console.error("setup email SES fallback send failed", {
          name: fallback.sesName,
          code: fallback.sesCode,
          httpStatus: fallback.httpStatus,
          message: fallback.message,
        });
      }
    }

    throw new SetupEmailError({
      sesName: info.sesName,
      sesCode: info.sesCode,
      httpStatus: info.httpStatus,
      clientHint: info.clientHint,
    });
  }
}
