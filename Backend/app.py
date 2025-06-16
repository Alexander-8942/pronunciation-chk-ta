from flask import Flask, request, jsonify
from flask_cors import CORS  # Install: pip install flask-cors
from werkzeug.utils import secure_filename
import os
from asr_model import transcribe_audio
from compare import compare_tamil_graphemes
from utils.base_aud_tools import convert_to_wav
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow all origins (for testing)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/check', methods=['POST'])
def check_pronunciation():
    try:
        print("🔹 Received request to /check")  # DEBUG
        print("🔹 Files:", request.files)  # DEBUG
        print("🔹 Args:", request.args)  # DEBUG
        print(f"🔹 Received request at: {datetime.now()}") #DEBUG

        if 'audio' not in request.files:
            print("❌ No audio file in request")  # DEBUG
            return jsonify({'error': 'No audio file'}), 400

        expected_word = request.args.get("expected", "").strip()
        print("🟢 Expected word:", expected_word)  # DEBUG

        audio_file = request.files['audio']
        filename = secure_filename(audio_file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        audio_file.save(file_path)
        print("📁 Saved uploaded file to:", file_path)  # DEBUG

        # Convert to WAV (16kHz mono)
        print("🔄 Converting to WAV...")  # DEBUG
        wav_path = convert_to_wav(file_path)
        print("✅ WAV path:", wav_path)  # DEBUG

        if not wav_path:
            print("❌ Audio conversion failed")  # DEBUG
            return jsonify({'error': 'Audio conversion failed'}), 500

        start = datetime.now()
        print(f"🧠 Running transcription...  :  {start}")  # DEBUG
        transcription = transcribe_audio(wav_path)
        end = datetime.now()
        
        print(f"📝 Transcribed text: {transcription}   {end}")  # DEBUG

        #print(f"📝 Transcribed text: ", transcription, "  ",{end})  # DEBUG
        print(f"🕒 Transcription duration: {end - start}")

        transcribed_text = transcription.strip()
        print("✂️ Stripped text:", transcribed_text)  # DEBUG

        print("📐 Comparing transcription with expected word...")  # DEBUG
        compare_result = compare_tamil_graphemes(expected_word, transcribed_text)
        print("📊 Comparison result:", compare_result)  # DEBUG

        result = "Correct" if compare_result.get("is_exact") else "Incorrect"
        print("✅ Final result:", result)  # DEBUG

        return jsonify({
            "result": result
        })

    except Exception as e:
        print("❌ Exception occurred:", str(e))  # DEBUG
        return jsonify({'error': 'Internal Server Error', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
