import ffmpeg

def convert_to_wav(input_path):
    output_path = input_path.rsplit('.', 1)[0] + '.wav'
    try:
        ffmpeg.input(input_path).output(
            output_path,
            format='wav',
            ac=1,          # mono
            ar='16000'     # 16kHz
        ).overwrite_output().run(quiet=True)
        return output_path
    except Exception as e:
        print(f"FFmpeg error: {e}")
        return None