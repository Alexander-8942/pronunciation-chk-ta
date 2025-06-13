import streamlit as st
from streamlit_webrtc import webrtc_streamer, WebRtcMode, ClientSettings
import av
import os
import tempfile
from asr_model import transcribe_audio
from compare import compare_tamil_graphemes
from utils.base_aud_tools import convert_to_wav

words = [
    "நீர்வீழ்ச்சி", "பருப்பு", "முட்டை", "குறிஞ்சி", "வானம்",
    "மழை", "மலர்", "பசு", "மரம்", "தடாகம்"
]

if 'current_index' not in st.session_state:
    st.session_state.current_index = 0

current_word = words[st.session_state.current_index]
st.title("🎤 Record Your Tamil Pronunciation")
st.markdown(f"### Word {st.session_state.current_index + 1}: **{current_word}**")

# Recorder
ctx = webrtc_streamer(
    key="recorder",
    mode=WebRtcMode.SENDRECV,
    client_settings=ClientSettings(
        media_stream_constraints={"audio": True, "video": False},
        rtc_configuration={ "iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}] },
    ),
    audio_receiver_size=1024,
)

if ctx.audio_receiver:
    audio_frames = ctx.audio_receiver.get_frames(timeout=1)
    if audio_frames:
        # Save audio frames to WAV
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
            wf = av.open(f.name, mode="w", format="wav")
            stream = wf.add_stream("pcm_s16le", rate=audio_frames[0].sample_rate)
            stream.channels = audio_frames[0].layout.channels
            for frame in audio_frames:
                wf.mux(frame)
            wf.close()
            recorded_audio_path = f.name

        st.success("✅ Recording received!")
        transcription = transcribe_audio(recorded_audio_path)
        transcribed_text = transcription.strip()
        st.write(f"📝 Transcribed: {transcribed_text}")

        result = compare_tamil_graphemes(current_word, transcribed_text)
        if result["is_exact"]:
            st.success("Correct pronunciation!")
            st.session_state.current_index += 1
            if st.session_state.current_index < len(words):
                st.experimental_rerun()
            else:
                st.balloons()
                st.markdown("## 🎉 All words completed!")
        else:
            st.error("Incorrect. Try again.")
            with st.expander("Details"):
                st.write(result)
