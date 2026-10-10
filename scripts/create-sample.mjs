import { mkdirSync, writeFileSync } from "node:fs";
const pages = [
  [
    "Folio Research Brief - 2026",
    "Executive summary",
    "Revenue grew by 24 percent year over year to $4.8 million.",
    "Customer retention reached 92 percent, up from 86 percent.",
    "The strongest growth came from the enterprise segment.",
    "The team recommends investing in customer onboarding.",
  ],
  [
    "Folio Research Brief - Recommendations",
    "Operational findings",
    "Average support response time fell from 8 hours to 3 hours.",
    "Customer onboarding remains the largest source of friction.",
    "Recommended next steps: improve onboarding documentation,",
    "launch a self-service knowledge base, and measure activation.",
    "The next quarterly review is scheduled for December 2026.",
  ],
];
const objects = [];
const add = (s) => {
  objects.push(s);
  return objects.length;
};
add("<< /Type /Catalog /Pages 2 0 R >>");
add("");
add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const pageIds = [];
for (const lines of pages) {
  const stream =
    "BT /F1 14 Tf 50 750 Td 23 TL " +
    lines
      .map(
        (line, i) => `${i ? "T* " : ""}(${line.replace(/[()\\]/g, "\\$&")}) Tj`,
      )
      .join("\n") +
    " ET";
  const content = add(
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  );
  pageIds.push(
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`,
    ),
  );
}
objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((obj, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
  .slice(1)
  .map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)
  .join(
    "",
  )}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
mkdirSync("public", { recursive: true });
writeFileSync("public/sample-research.pdf", pdf);
