import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-ses";

const SETUP_INBOX = "rahul98@gmail.com";

export function setupInboxAddress() {
  return SETUP_INBOX;
}

export function setupFromAddress() {
  return process.env.SES_FROM_EMAIL?.trim() || "alerts@mavex.live";
}

function getSesClient(): SESClient {
  const region = process.env.AWS_REGION?.trim() || "us-east-1";
  const accessKeyId = process.env.GOVT_AWS_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.GOVT_AWS_SECRET_ACCESS_KEY?.trim();
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
    process.env.GOVT_AWS_ACCESS_KEY?.trim() &&
      process.env.GOVT_AWS_SECRET_ACCESS_KEY?.trim()
  );
}

export async function sendSetupRequestEmail(input: {
  subject: string;
  text: string;
  replyTo: string;
}): Promise<void> {
  const params: SendEmailCommandInput = {
    Source: setupFromAddress(),
    Destination: { ToAddresses: [setupInboxAddress()] },
    ReplyToAddresses: [input.replyTo],
    Message: {
      Subject: { Data: input.subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: input.text, Charset: "UTF-8" },
      },
    },
    Tags: [{ Name: "type", Value: "rsvpshare-setup" }],
  };

  const identityArn = process.env.SES_IDENTITY_ARN?.trim();
  if (identityArn) {
    params.SourceArn = identityArn;
  }

  await getSesClient().send(new SendEmailCommand(params));
}
