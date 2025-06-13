import grapheme
import unicodedata

def tamil_letter_split(text):
    if not text:
        return []

    result = []
    i = 0

    special_conjuncts = ["ஸ்ரீ", "க்ஷெள", "க்ஷ்",	"க்ஷ",	"க்ஷா",	"க்ஷி",	"க்ஷீ",	"க்ஷு",	"க்ஷூ",	"க்ஷெ",	"க்ஷே",	"க்ஷை",	"க்ஷொ",	"க்ஷோ"]

    graphemes = list(grapheme.graphemes(text))

    while i < len(graphemes):
        g = graphemes[i]
        matched = False

        # Check for special conjuncts
        for conj in special_conjuncts:
            conj_graphemes = list(grapheme.graphemes(conj))
            if graphemes[i:i+len(conj_graphemes)] == conj_graphemes:
                result.append(conj)
                i += len(conj_graphemes)
                matched = True
                break

        if matched:
            continue

        # Otherwise, just append the grapheme as is
        result.append(g)
        i += 1

    return result

def split_base_marker(g):
    base = ''
    marker = ''
    for char in g:
        if unicodedata.category(char).startswith('M') or char in 'ாிீுூெேைொோௌ்':
            marker += char
        else:
            base += char
    return base, marker
