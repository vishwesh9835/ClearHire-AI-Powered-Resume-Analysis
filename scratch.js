const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: "invalid_key" });

async function test() {
  try {
    await groq.chat.completions.create({
      messages: [{ role: "user", content: "hello" }],
      model: "openai/gpt-oss-120b"
    });
  } catch (err) {
    console.log("err.message type:", typeof err.message);
    console.log("err.message:", err.message);
    console.log("err object:", err);
  }
}
test();
