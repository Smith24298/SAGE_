def herzberg_analysis(text):

    motivators = []
    hygiene = []

    if "recognition" in text:
        motivators.append("Recognition")

    if "growth" in text:
        motivators.append("Growth")

    if "salary" in text:
        hygiene.append("Salary")

    if "workload" in text:
        hygiene.append("Work Conditions")

    return motivators, hygiene