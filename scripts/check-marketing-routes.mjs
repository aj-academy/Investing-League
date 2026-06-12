import http from "http";

const paths = ["/", "/about", "/courses", "/contact", "/login", "/course"];

function get(path) {
  return new Promise((resolve, reject) => {
    const port = process.env.CHECK_PORT || "3010";
    http
      .get(`http://127.0.0.1:${port}${path}`, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ path, status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

const results = await Promise.all(paths.map(get));
for (const r of results) {
  const ok = r.status === 200 || r.status === 307 || r.status === 308;
  const hasMarketing =
    r.body.includes("The Investing League") || r.body.includes("Decision Lab");
  console.log(`${r.path} → ${r.status} ${ok ? "OK" : "FAIL"} ${hasMarketing ? "content" : "no-content"}`);
}
const failed = results.filter((r) => r.status !== 200 && r.status !== 307 && r.status !== 308);
if (failed.length) process.exit(1);
