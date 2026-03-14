const verifyEmail = require("./verifyEmail");

(async () => {
  const result = await verifyEmail("user@gmial.com");

  console.log(result);
})();