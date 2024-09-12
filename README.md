# Spatial Data Converter

Spatial Data Converter is a web application that allows users to convert spatial data files between different formats and coordinate reference systems (CRS). It provides a user-friendly interface for uploading files, selecting conversion parameters, and downloading the converted results.

## Features

- Convert spatial data files between various formats (e.g., GeoJSON, CSV, Parquet, Shapefile, GDB)
- Change coordinate reference systems (CRS)
- Apply simplification to geometries
- User-friendly interface with progress tracking
- Secure file handling using Google Cloud Storage
- Serverless backend using Google Cloud Functions

## Technologies Used

- Frontend:
  - React
  - NextJS
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
- Backend:
  - Google Cloud Functions
  - Python
  - GDAL (Geospatial Data Abstraction Library)
- Storage:
  - Google Cloud Storage

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Google Cloud account with billing enabled
- Google Cloud SDK

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/spatial-data-converter.git
   cd spatial-data-converter
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Set up Google Cloud project and enable necessary APIs:
   - Cloud Functions API
   - Cloud Storage API

4. Create a Google Cloud Storage bucket for file uploads and downloads

5. Deploy Cloud Functions:
   ```
   gcloud functions deploy upload_file --runtime python39 --trigger-http --allow-unauthenticated
   gcloud functions deploy convert_file --runtime python39 --trigger-http --allow-unauthenticated
   ```

6. Update the frontend code with your Cloud Function URLs:
   - In `src/spatial-data-converter.tsx`, replace `YOUR_CLOUD_FUNCTION_UPLOAD_URL` and `YOUR_CLOUD_FUNCTION_CONVERT_URL` with the actual URLs of your deployed functions.

7. Start the development server:
   ```
   npm run dev
   ```

8. Open your browser and navigate to `http://localhost:5173` to use the application.

## Usage

1. Upload a spatial data file using the file input.
2. Select the input and output formats.
3. Choose the input and output coordinate reference systems (CRS).
4. Adjust the simplification level if needed.
5. Click the "Convert" button to start the conversion process.
6. Once the conversion is complete, click the "Download Converted File" button to get the result.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [GDAL](https://gdal.org/) for spatial data processing
- [shadcn/ui](https://ui.shadcn.com/) for React components
- [Google Cloud Platform](https://cloud.google.com/) for serverless infrastructure

