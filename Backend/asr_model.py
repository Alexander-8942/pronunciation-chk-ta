from transformers import pipeline
import torch

device = "cuda:0" if torch.cuda.is_available() else "cpu"

#  Model is loaded ONCE at import time
print("\nLoading Whisper model...\n")
asr_pipeline = pipeline(
    task="automatic-speech-recognition",
    model="vasista22/whisper-tamil-medium",
    chunk_length_s=30,
    device=device
)

asr_pipeline.model.config.forced_decoder_ids = asr_pipeline.tokenizer.get_decoder_prompt_ids(
    language="ta", task="transcribe"
)

def transcribe_audio(audio_path):
    return asr_pipeline(audio_path)["text"]
