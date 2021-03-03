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
    )

    operation = client.long_running_recognize(config=config, audio=audio)

    print(u"Waiting for operation to complete...")
    response = operation.result()

    results = []
    for result in response.results:
        # First alternative is the most probable result
        alternative = result.alternatives[0]
        print(u"Transcript: {}".format(alternative.transcript))
        results.append(alternative.transcript)

    return results


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
@click.argument('transcript-path', type=str)
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
    log.debug(transcript)
    with open(transcript_path, 'w') as f:
        f.write('\n'.join(transcript))

    return 0


if __name__ == '__main__':
    # pylint: disable=E1120
    sys.exit(cli())
