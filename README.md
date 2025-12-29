# Universal File Converter

A privacy-first web application for converting files directly in the browser. No uploads, no servers, completely client-side processing.

## Features

### Smart File Detection
Automatically detects file types and shows only valid conversion options for each format.

### Supported Conversions
- **PDF** → Text, JSON
- **CSV** ↔ JSON, Text
- **JSON** ↔ CSV, Text  
- **Text** → Base64, JSON, CSV
- **Images** → PNG, JPEG, WEBP, Base64

### Privacy & Performance
- All processing happens locally in your browser
- No file uploads to external servers
- No data collection or tracking
- Instant conversions with no latency

## Tech Stack

- **React** - Component-based UI
- **PDF.js** - Mozilla's PDF parsing library
- **PapaParse** - High-performance CSV parser
- **Canvas API** - Native image format conversion

## Installation
```bash
git clone https://github.com/Phinx149/Gopher-File.git
cd Gopher-File
npm install
npm start
```

## Usage

1. Upload any supported file
2. Application auto-detects the file type
3. Select target format from available options
4. Click Convert and download the result

## Architecture

### File Type Detection
Uses both file extensions and MIME types for accurate detection, with fallback handling for edge cases.

### Conversion Pipeline
Each file type has dedicated conversion functions that handle format-specific parsing and encoding, ensuring data integrity throughout the process.

### Error Handling
Comprehensive try-catch blocks with user-friendly error messages for failed conversions or unsupported formats.

## Future Enhancements

- Batch file conversion
- Drag-and-drop interface
- Additional formats (DOCX, XLSX, PPTX)
- Image compression options
- PDF merge/split functionality

## License

MIT
