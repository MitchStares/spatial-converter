import os
from google.cloud import storage
from flask import Flask, request, jsonify
import geopandas as gpd
import datetime

app = Flask(__name__)

storage_client = storage.Client()
bucket = storage_client.bucket(os.environ.get('GCP_BUCKET_NAME'))

@app.route('/', methods=['POST'])
def convert_file():
    data = request.json
    file_id = data['fileId']
    file_name = data['fileName']
    output_format = data['outputFormat']
    input_format = data['inputFormat']
    input_crs = data['inputCRS']
    output_crs = data['outputCRS']
    simplification = data['simplification']

    # Download file from GCS
    input_blob = bucket.blob(file_name)
    input_file = f'/tmp/{file_name}'
    input_blob.download_to_filename(input_file)

    # Read the file with geopandas
    gdf = gpd.read_file(input_file, driver=input_format)

    # Apply CRS transformation if needed
    if input_crs != output_crs:
        gdf = gdf.to_crs(output_crs)

    # Apply simplification if needed
    if simplification > 0:
        gdf = gdf.simplify(simplification)

    # Save to output format
    output_file = f'/tmp/{file_id}.{output_format}'
    gdf.to_file(output_file, driver=output_format)

    # Upload result to GCS
    output_blob = bucket.blob(f'{file_id}.{output_format}')
    output_blob.upload_from_filename(output_file)

    # Generate signed URL for download
    url = output_blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=15),
        method="GET"
    )

    return jsonify({'status': 'success', 'downloadUrl': url})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
