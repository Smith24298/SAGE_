from backend.database import employees
from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def hr_chat(question):
    try:
        if employees is None:
            raise Exception("Database connection not available")
        
        twins = list(employees.find())

        context = ""

        for t in twins:
            context += str(t) + "\n"

        if not context.strip():
            context = "No employee digital twins found in the system."

        prompt = f"""
        You are an HR leadership assistant.

        Employee Digital Twins:
        {context}

        HR Question:
        {question}

        Provide insights and recommendations.
        """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role":"user","content":prompt}]
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in hr_chat: {e}")
        raise