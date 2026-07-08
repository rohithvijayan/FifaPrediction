async function test() {
  const url = 'https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200';
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("HTTP error:", res.status);
      return;
    }
    const data = await res.json();
    console.log("Total standing items in FIFA API:", data.Results ? data.Results.length : 0);
    if (data.Results && data.Results.length > 0) {
      console.log("Sample group standing from FIFA API:", JSON.stringify(data.Results.slice(0, 3), null, 2));
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
