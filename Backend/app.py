from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from asr_model import transcribe_audio
from compare import compare_tamil_graphemes
from utils.base_aud_tools import convert_to_wav

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/check', methods=['POST'])
def check_pronunciation():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400

    expected_word = request.args.get("expected", "").strip()
    audio_file = request.files['audio']
    filename = secure_filename(audio_file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    audio_file.save(file_path)

    # Convert to WAV (16kHz mono)
    wav_path = convert_to_wav(file_path)
    if not wav_path:
        return jsonify({'error': 'Audio conversion failed'}), 500

    transcription = transcribe_audio(wav_path)  # Tamil
    
    transcribed_text = transcription['text'].strip()

    compare_result = compare_tamil_graphemes(expected_word, transcribed_text)
    result = "Correct" if compare_result["is_exact"] else "Incorrect"

    return jsonify({
        "result": result  
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
