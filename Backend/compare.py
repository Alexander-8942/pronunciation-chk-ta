from utils.base_tools import * 

phonetic_map = {
    'ல': ['ள'],
    'ள': ['ல'],
    'ந': ['ண', 'ன'],
    'ண': ['ந', 'ன'],
    'ன': ['ந', 'ண'],
    'ர': ['ற'],
    'ற': ['ர'],
}


def compare_tamil_graphemes(expected_text, transcribed_text):
    expected_graphemes = tamil_letter_split(expected_text)
    transcribed_graphemes = tamil_letter_split(transcribed_text)

    min_len = min(len(expected_graphemes), len(transcribed_graphemes))
    max_len = max(len(expected_graphemes), len(transcribed_graphemes))

    correct = 0
    total = max_len

    for i in range(min_len):
        eg = expected_graphemes[i]
        tg = transcribed_graphemes[i]

        if eg == tg:
            correct += 1
            continue

        eg_base, eg_marker = split_base_marker(eg)
        tg_base, tg_marker = split_base_marker(tg)

        matched = False
        for base_letter in phonetic_map:
            if base_letter in eg_base and any(other in tg_base for other in phonetic_map[base_letter]):
                if eg_marker == tg_marker:
                    correct += 1
                    matched = True
                    break

    return {
        "score": correct / total if total else 0,
        "matched_count": correct,
        "total_count": total,
        "is_exact": correct == total,
        "expected_split": expected_graphemes,
        "transcribed_split": transcribed_graphemes
    }
