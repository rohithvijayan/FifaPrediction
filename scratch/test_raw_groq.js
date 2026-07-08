const { Groq } = require('groq-sdk');

async function test() {
  try {
    const apiKey = process.env.GROQ_API_KEY || '***REMOVED***';
    const groq = new Groq({ apiKey });

    const systemPrompt = `You are a sports data assistant. Output exactly 32 matches in a JSON array under the key "results".
Match numbers: 73 to 104 inclusive.
For 97 to 104, set status to 'Upcoming', teams to 'TBD', scores to null.`;

    const userPrompt = `Generate all 32 matches.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    console.log("Raw length:", content.length);
    // Check if it ends with } or is truncated
    console.log("Ends with:", content.substring(content.length - 100));
    const parsed = JSON.parse(content);
    console.log("Number of results parsed:", parsed.results.length);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
