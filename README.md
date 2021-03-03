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
ffmpeg -i stereo.wav -ac 1 mono.wav
```

### Run

```bash
google-transcribe -l sv-SE -s 44100 gs://my-bucket/short.wav ./transcript.txt
```
