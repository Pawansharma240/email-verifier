const verifyEmail = require("../verifyEmail");
const getDidYouMean = require("../didYouMean");

test("valid email syntax", async () => {
  const result = await verifyEmail("test@gmail.com");

  expect(result.email).toBe("test@gmail.com");
});

test("invalid syntax", async () => {
  const result = await verifyEmail("testgmail.com");

  expect(result.result).toBe("invalid");
});

test("typo detection", () => {
  const suggestion = getDidYouMean("user@gmial.com");

  expect(suggestion).toBe("user@gmail.com");
});

test("empty string", async () => {
  const result = await verifyEmail("");

  expect(result.result).toBe("invalid");
});

test("multiple @ symbols", async () => {
  const result = await verifyEmail("a@@gmail.com");

  expect(result.result).toBe("invalid");
});

test("very long email", async () => {
  const email = "a".repeat(100) + "@gmail.com";

  const result = await verifyEmail(email);

  expect(result.email).toBe(email);
});