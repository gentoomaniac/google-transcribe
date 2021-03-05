import json
import logging
import sys

import click

from google.cloud import speech
import io

log = logging.getLogger(__file__)


def sample_long_running_recognize(file_path: str,
                                  model: str = 'video',
                                  sample_rate: int = 16000,
                                  language_code: str = 'en-US'):
    """
    Transcribe a long audio file using asynchronous speech recognition

    Args:
      file_path Path to audio file, e.g. /path/audio.wav or gcs://bucket/filename
    """

    client = speech.SpeechClient()
    config = {"language_code": language_code, "sample_rate_hertz": sample_rate, "model": model}

    if not file_path.startswith('gs://'):
        with io.open(file_path, "rb") as f:
            content = f.read()
        audio = speech.RecognitionAudio(content=content)
    else:
        audio = speech.RecognitionAudio(uri=file_path)

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=sample_rate,
        language_code=language_code,
        enable_word_time_offsets=True,
    )

    operation = client.long_running_recognize(config=config, audio=audio)
    response = operation.result()

    transcript = {'transcript': [], 'words': []}
    words = []
    for result in response.results:
        alternative = result.alternatives[0]

        start_time = alternative.words[0].start_time.total_seconds()
        end_time = alternative.words[-1].end_time.total_seconds()
        transcript["transcript"].append({
            'text': alternative.transcript,
            'confidence': alternative.confidence,
            'start_word': len(words),
            'end_word': len(words) + len(alternative.words),
            'start_time': start_time,
            'end_time': end_time
        })

        for word in alternative.words:
            words.append([word.word, word.start_time.total_seconds(), word.end_time.total_seconds()])

    transcript['words'] = words
    return transcript


def _configure_logging(verbosity):
    loglevel = max(3 - verbosity, 0) * 10
    logging.basicConfig(level=loglevel, format='[%(asctime)s] %(levelname)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    if loglevel >= logging.DEBUG:
        # Disable debugging logging for external libraries
        for loggername in 'urllib3', 'google.auth.transport.requests':
            logging.getLogger(loggername).setLevel(logging.CRITICAL)


@click.command()
@click.option('-v', '--verbosity', help='Verbosity', default=0, count=True)
@click.option('-l', '--language-code', help='langauge code', default="en-US")
@click.option('-m', '--ml-model', help='ml model to use', default="video")
@click.option('-s', '--sample-rate', help='sample rate', default=16000)
@click.argument('filename', type=str)
@click.argument('transcript-path', type=str, required=False)
def cli(verbosity: int, language_code: str, ml_model: str, sample_rate: int, filename: str, transcript_path: str):
    """ main program
    """
    _configure_logging(verbosity)

    log.info("Transcribing %s", filename)
    log.info("Writing transcript to %s", transcript_path)
    transcript = sample_long_running_recognize(filename,
                                               model=ml_model,
                                               sample_rate=sample_rate,
                                               language_code=language_code)

    if transcript_path:
        with open(transcript_path, 'w') as f:
            json.dump(transcript, fp=f)
    else:
        print(json.dumps(transcript))

    return 0


if __name__ == '__main__':
    # pylint: disable=E1120
    sys.exit(cli())
