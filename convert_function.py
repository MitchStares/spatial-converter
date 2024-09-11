import os
from google.cloud import storage
from flask import Flask, request, jsonify
import geopandas as gpd

app = Flask(__name__)

storage_client = storage.Client()
bucket = storage_client.bucket(os.environ.get('GCP_BUCKET_NAME'))

@app.route('/', methods=['POST'])
def convert_file():
    data = request.json
    file_id = data['fileId']
    file_name = data['fileName']
    output_format = data['outputFormat']

    input_blob = bucket.blob(file_name)
    input_file = f'/tmp/{file_name}'
    input_blob.download_to_filename(input_file)

    gdf = gpd.read_file(input_file)
    output_file = f'/tmp/{file_id}.{output_format}'

    if output_format == 'geojson':
        gdf.to_file(output_file, driver='GeoJSON')
    elif output_format == 'shp':
        gdf.to_file(output_file, driver='ESRI Shapefile')
    # Add more format conversions as needed

    output_blob = bucket.blob(f'{file_id}.{output_format}')
    output_blob.upload_from_filename(output_file)

    return jsonify({'status': 'success', 'outputFile': f'{file_id}.{output_format}'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
