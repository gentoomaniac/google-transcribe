# google-transcribe

A script for transcribing audio files using the google speech api

## Installation

``` bash
git clone https://github.com/gentoomaniac/google-transcribe.git
cd google-transcribe

python3 -m venv .venv
. .venv/bin/activate
pip install .
```

## Usage

Small audio files can be sent from local disk.
Larger audio files require however the file to be in GCS.

### GCP preparation

* enable Google SPeech API
* create a GCS bucket for storing larger audio files

### GCP authentication

Create a GCP service account that has read access to the bucket storing the audio file and the Google SPeech API.
Download the service accounts key and set the default credentials.

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentialfile.json
```

### Preparing autio files

Audio files need to be in uncompressed WAV and have to be *mono*

``` bash
ffmpeg -i stereo.m4a -ac 1 mono.wav
```

Upload the file either via webui or using gsutil

```bash
gsutil cp mono.wav gs://my-bucket/
```

### Run

```bash
google-transcribe -l sv-SE -s 44100 gs://my-bucket/mono.wav ./transcript.txt
```

### Output

The output is json formated to include single word timings and confidence.
To get a simple text output you can use the tool [jq](https://stedolan.github.io/jq/)

```bash
jq '.[].transcript' <transcript.json
```

## Known problems

### Quotas

```bash
google.api_core.exceptions.ResourceExhausted: 429 Resource has been exhausted (e.g. check quota).
```

The default quota for audio minutes per day is 3600 seconds or one hour.
If you run into this, go to `Cloud Speech-to-Text API` > `Quotas` and adjust as necessary.
