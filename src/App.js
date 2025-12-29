import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import Papa from 'papaparse';
import './App.css';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function App() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [output, setOutput] = useState('');
  const [target, setTarget] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detect file type from extension and MIME type
  const detectFileType = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const mime = file.type;

    if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
    if (ext === 'csv' || mime === 'text/csv') return 'csv';
    if (ext === 'json' || mime === 'application/json') return 'json';
    if (['txt', 'md'].includes(ext) || mime.startsWith('text/')) return 'text';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext) || mime.startsWith('image/')) return 'image';
    
    return 'unknown';
  };

  // Get available conversion options based on detected file type
  const getConversionOptions = (sourceType) => {
    const options = {
      'pdf': ['text', 'json'],
      'csv': ['json', 'text'],
      'json': ['csv', 'text'],
      'text': ['base64', 'json', 'csv'],
      'image': ['png', 'jpeg', 'webp', 'base64']
    };
    return options[sourceType] || [];
  };

  const handleFile = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const detectedType = detectFileType(uploadedFile);
    setFileType(detectedType);
    
    // Set default target based on file type
    const options = getConversionOptions(detectedType);
    setTarget(options[0] || '');
    
    setOutput('');
    setDownloadLink('');
    setError('');
  };

  async function handleConvert() {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    if (!target) {
      setError('Please select a target format');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // PDF conversions
      if (fileType === 'pdf') {
        if (target === 'text') {
          await convertPdfToText();
        } else if (target === 'json') {
          await convertPdfToJson();
        }
      }
      
      // CSV conversions
      else if (fileType === 'csv') {
        if (target === 'json') {
          await convertCsvToJson();
        } else if (target === 'text') {
          const text = await file.text();
          setOutput(text);
          downloadTextFile(text, 'converted.txt');
        }
      }
      
      // JSON conversions
      else if (fileType === 'json') {
        if (target === 'csv') {
          await convertJsonToCsv();
        } else if (target === 'text') {
          const text = await file.text();
          const formatted = JSON.stringify(JSON.parse(text), null, 2);
          setOutput(formatted);
          downloadTextFile(formatted, 'formatted.txt');
        }
      }
      
      // Text conversions
      else if (fileType === 'text') {
        if (target === 'base64') {
          const text = await file.text();
          const encoded = btoa(text);
          setOutput(encoded);
          downloadTextFile(encoded, 'encoded.txt');
        } else if (target === 'json') {
          const text = await file.text();
          const lines = text.split('\n').filter(l => l.trim());
          const jsonStr = JSON.stringify({ lines }, null, 2);
          setOutput(jsonStr);
          downloadTextFile(jsonStr, 'converted.json');
        } else if (target === 'csv') {
          const text = await file.text();
          const lines = text.split('\n').filter(l => l.trim());
          const csv = lines.map(line => `"${line}"`).join('\n');
          setOutput(csv);
          downloadTextFile(csv, 'converted.csv');
        }
      }
      
      // Image conversions
      else if (fileType === 'image') {
        if (target === 'base64') {
          await convertImageToBase64();
        } else {
          await convertImageFormat(target);
        }
      }

    } catch (err) {
      setError(`Conversion failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function convertPdfToText() {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const lines = {};
      for (const item of content.items) {
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item.str);
      }

      const sortedY = Object.keys(lines)
        .map(Number)
        .sort((a, b) => b - a);

      for (const y of sortedY) {
        text += lines[y].join(' ') + '\n';
      }

      text += `\n-------- Page ${i} --------\n\n`;
    }

    setOutput(text);
    downloadTextFile(text, 'converted.txt');
  }

  async function convertPdfToJson() {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      pages.push({ page: i, text });
    }

    const jsonStr = JSON.stringify({ pages }, null, 2);
    setOutput(jsonStr);
    downloadTextFile(jsonStr, 'converted.json');
  }

  async function convertCsvToJson() {
    const text = await file.text();
    const result = Papa.parse(text, { header: true });
    const jsonStr = JSON.stringify(result.data, null, 2);
    setOutput(jsonStr);
    downloadTextFile(jsonStr, 'converted.json');
  }

  async function convertJsonToCsv() {
    const text = await file.text();
    const obj = JSON.parse(text);
    const csv = Papa.unparse(obj);
    setOutput(csv);
    downloadTextFile(csv, 'converted.csv');
  }

  async function convertImageToBase64() {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result.split(',')[1];
      setOutput(base64);
      downloadTextFile(base64, 'image_base64.txt');
    };
    reader.readAsDataURL(file);
  }

  async function convertImageFormat(format) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          setDownloadLink(url);
          setOutput(`Image converted to ${format.toUpperCase()}! Click download below.`);
        }, `image/${format}`);
      };
    };
    reader.readAsDataURL(file);
  }

  function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    setDownloadLink(url);
  }

  return (
    <div className="App">
      <div className="container">
        <h1>Universal File Converter</h1>
        <p className="subtitle">Convert files instantly in your browser</p>

        <div className="upload-section">
          <label htmlFor="file-upload" className="file-label">
            {file ? `${file.name} (${fileType.toUpperCase()})` : 'Choose File'}
          </label>
          <input 
            id="file-upload"
            type="file" 
            onChange={handleFile}
            style={{ display: 'none' }}
          />

          {fileType && (
            <select onChange={(e) => setTarget(e.target.value)} value={target}>
              <option value="">Select target format...</option>
              {getConversionOptions(fileType).map(option => (
                <option key={option} value={option}>
                  {fileType.toUpperCase()} → {option.toUpperCase()}
                </option>
              ))}
            </select>
          )}

          <button 
            onClick={handleConvert} 
            disabled={loading || !file || !target}
            className="convert-btn"
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {output && (
          <div className="output-section">
            <h3>Output Preview</h3>
            <textarea
              className="output-box"
              readOnly
              value={output}
            />
          </div>
        )}

        {downloadLink && (
          <div className="download-section">
            <a href={downloadLink} download className="download-btn">
              Download Converted File
            </a>
          </div>
        )}

        <div className="features">
          <div className="feature">
            <h4>Auto-Detection</h4>
            <p>Automatically detects your file type</p>
          </div>
          <div className="feature">
            <h4>Private</h4>
            <p>All processing happens locally</p>
          </div>
          <div className="feature">
            <h4>Free</h4>
            <p>No limits or sign-ups required</p>
          </div>
        </div>

        {fileType && (
          <div className="info">
            <h4>Supported Conversions from {fileType.toUpperCase()}:</h4>
            <p>{getConversionOptions(fileType).map(t => t.toUpperCase()).join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;