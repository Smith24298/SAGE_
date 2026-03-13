def parse_transcript(text):

    conversations = []

    for line in text.split("\n"):

        if ":" in line:

            speaker, message = line.split(":",1)

            conversations.append({
                "speaker": speaker.strip(),
                "message": message.strip()
            })

    return conversations