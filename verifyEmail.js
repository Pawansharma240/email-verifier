const dns = require("dns").promises;
const { SMTPClient } = require("smtp-client");
const getDidYouMean = require("./didYouMean");

function validateEmailSyntax(email) {
  if (!email || typeof email !== "string") return false;

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) return false;

  if ((email.match(/@/g) || []).length !== 1) return false;

  return true;
}

function getDomain(email) {
  return email.split("@")[1];
}

async function getMXRecords(domain) {
  try {
    const records = await dns.resolveMx(domain);

    return records.map((r) => r.exchange);
  } catch (err) {
    return [];
  }
}

async function checkMailbox(mx, email) {
  const client = new SMTPClient({
    host: mx,
    port: 25,
    timeout: 5000
  });

  try {
    await client.connect();

    await client.greet({ hostname: "example.com" });

    await client.mail({ from: "test@example.com" });

    await client.rcpt({ to: email });

    await client.quit();

    return "mailbox_exists";
  } catch (err) {
    try {
      await client.close();
    } catch {}

    if (err.message && err.message.includes("550")) {
      return "mailbox_does_not_exist";
    }

    if (err.message && err.message.includes("450")) {
      return "greylisted";
    }

    return "connection_error";
  }
}

async function verifyEmail(email) {
  const start = Date.now();

  const result = {
    email: email,
    result: "",
    resultcode: 0,
    subresult: "",
    domain: "",
    mxRecords: [],
    executiontime: 0,
    error: null,
    timestamp: new Date().toISOString(),
    didyoumean: null
  };

  try {
    if (!validateEmailSyntax(email)) {
      result.result = "invalid";
      result.resultcode = 6;
      result.subresult = "invalid_syntax";
      return result;
    }

    const suggestion = getDidYouMean(email);

    if (suggestion) {
      result.didyoumean = suggestion;
      result.result = "invalid";
      result.resultcode = 6;
      result.subresult = "typo_detected";
      return result;
    }

    const domain = getDomain(email);
    result.domain = domain;

    const mxRecords = await getMXRecords(domain);
    result.mxRecords = mxRecords;

    if (mxRecords.length === 0) {
      result.result = "invalid";
      result.resultcode = 6;
      result.subresult = "no_mx_records";
      return result;
    }

    const mailbox = await checkMailbox(mxRecords[0], email);

    if (mailbox === "mailbox_exists") {
      result.result = "valid";
      result.resultcode = 1;
      result.subresult = mailbox;
    } else if (mailbox === "greylisted") {
      result.result = "unknown";
      result.resultcode = 3;
      result.subresult = mailbox;
    } else {
      result.result = "invalid";
      result.resultcode = 6;
      result.subresult = mailbox;
    }

    result.executiontime = (Date.now() - start) / 1000;

    return result;
  } catch (err) {
    result.result = "unknown";
    result.resultcode = 3;
    result.error = err.message;
    result.executiontime = (Date.now() - start) / 1000;

    return result;
  }
}

module.exports = verifyEmail;