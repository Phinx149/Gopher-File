import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist";
import Papa from "papaparse";
import "./App.css";

// 👇 Tell PDF.js where its worker file is located
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState("");
  const [target, setTarget] = useState("pdf-to-text");
  const [downloadLink, setDownloadLink] = useState("");

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setOutput("");
    setDownloadLink("");
  };

  async function handleConvert() {
    if (!file) return alert("Please upload a file first.");
    const type = target;

    // --- PDF → TEXT ---
    if (type === "pdf-to-text") {
      // --- PDF → TEXT ---
if (type === "pdf-to-text") {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group text items by their y-position (line)
    const lines = {};
    for (const item of content.items) {
      const y = Math.round(item.transform[5]); // vertical position
      if (!lines[y]) lines[y] = [];
      lines[y].push(item.str);
    }

    // Sort by y position descending (PDF coordinate system starts at bottom)
    const sortedY = Object.keys(lines)
      .map(Number)
      .sort((a, b) => b - a);

    for (const y of sortedY) {
      text += lines[y].join(" ") + "\n";
    }

    text += "\n-------------------- Page " + i + " --------------------\n\n";
  }

  setOutput(text);
  downloadTextFile(text, "converted.txt");
}


    }

    // --- CSV → JSON ---
    else if (type === "csv-to-json") {
      const text = await file.text();
      const result = Papa.parse(text, { header: true });
      const jsonStr = JSON.stringify(result.data, null, 2);
      setOutput(jsonStr);
      downloadTextFile(jsonStr, "converted.json");
    }

    // --- JSON → CSV ---
    else if (type === "json-to-csv") {
      const text = await file.text();
      const obj = JSON.parse(text);
      const csv = Papa.unparse(obj);
      setOutput(csv);
      downloadTextFile(csv, "converted.csv");
    }

    // --- IMAGE CONVERSION (JPG ↔ PNG ↔ WEBP) ---
    else if (type.startsWith("image-")) {
      const format = type.split("-")[1];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              const url = URL.createObjectURL(blob);
              setDownloadLink(url);
            },
            `image/${format}`
          );
        };
      };
      reader.readAsDataURL(file);
    }

    // --- TEXT ↔ BASE64 ---
    else if (type === "text-to-base64") {
      const text = await file.text();
      const encoded = btoa(text);
      setOutput(encoded);
      downloadTextFile(encoded, "encoded.txt");
    } else if (type === "base64-to-text") {
      const text = await file.text();
      const decoded = atob(text.trim());
      setOutput(decoded);
      downloadTextFile(decoded, "decoded.txt");
    }
  }

  function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    setDownloadLink(url);
  }

  return (
    <div className="App">
      <h1> Universal File Converter</h1>

      <input type="file" onChange={handleFile} />

      <select
        onChange={(e) => setTarget(e.target.value)}
        value={target}
        style={{ marginLeft: "10px" }}
      >
        <option value="pdf-to-text">PDF → Text</option>
        <option value="csv-to-json">CSV → JSON</option>
        <option value="json-to-csv">JSON → CSV</option>
        <option value="image-png">Image → PNG</option>
        <option value="image-jpeg">Image → JPG</option>
        <option value="image-webp">Image → WEBP</option>
        <option value="text-to-base64">Text → Base64</option>
        <option value="base64-to-text">Base64 → Text</option>
      </select>

      <button
        onClick={handleConvert}
        style={{ marginLeft: "10px", padding: "6px 12px" }}
      >
        Convert
      </button>

      {output && (
        <div style={{ marginTop: 20, textAlign: "left" }}>
          <h3>Output:</h3>
          <textarea
            style={{
              width: "90%",
              height: "250px",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
            readOnly
            value={output}
          />
        </div>
      )}

      {downloadLink && (
        <div style={{ marginTop: 20 }}>
          <a href={downloadLink} download>
            ⬇️ Download Converted File
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
