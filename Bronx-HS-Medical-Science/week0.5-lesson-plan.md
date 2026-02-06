# Week 0.5: GenAI Basics & Hallucination
## Bronx HS for Medical Science — "Understanding AI's Limits"

**Duration**: 44 minutes | **Position**: Pre-Week 1 Foundation  
**Theme**: GenAI can be wrong. It hallucinates. Our job is to know when and how.

---

## 1. LEARNING OBJECTIVES

| # | Learning Objective | Bloom's Level | How Assessed |
|---|--------------------|---------------|--------------|
| 1 | Define "hallucination" in the context of GenAI: confident-sounding information that is false, unverifiable, or fabricated | Understand | Mini-lesson check; exit ticket |
| 2 | Identify at least 2–3 conditions that increase the likelihood of AI hallucinations | Remember / Apply | Guided practice; debrief share-out |
| 3 | Write prompts designed to expose hallucination (for study) and observe how the model responds | Apply / Analyze | Exercise worksheet; observation |
| 4 | Explain why understanding hallucinations matters for future use of AI in medicine and research | Analyze | Debrief; exit ticket |

---

## 2. WHAT IS A GPT HALLUCINATION?

**Teacher reference — use this framing with students:**

> **A hallucination happens when the model:**
> 1. **Produces confident-sounding information**
> 2. **That is false, unverifiable, or fabricated**
> 3. **Especially when the prompt creates pressure to answer anyway**
>
> The AI doesn't "lie" on purpose—it predicts what words are likely to come next. If the pattern suggests an answer, it gives one, even when it shouldn't.

---

## 3. CONDITIONS THAT INCREASE HALLUCINATIONS

*Framing for students: "For study and understanding—so we know when to be skeptical—not for abuse."*

### Condition 1: Asking About Nonexistent or Obscure Facts

**What happens:** The model completes patterns instead of verifying whether something exists.

**Example pattern:**
> *"List the publications of Dr. X who invented Y in 1974"*
> (when Dr. X never existed)

**Why it works:** The model is trained to complete patterns, not to check if people, events, or facts are real.

---

### Condition 2: Forcing Specificity Where None Exists

**What happens:** Hallucinations spike when you ask for exact numbers, dates, or stats about poorly documented topics.

**Examples:**
> *"What percentage of hospitals adopted Protocol Z in 1993?"*  
> *"Give me the exact number of..."*

**Why it works:** The model fills in plausible-looking specifics even when no data exists.
x
---

### Condition 3: Framing the Question as If a False Premise Is True

**What happens:** The model explains instead of challenging the premise.

**Example:**
> *"Why did President Lincoln support the internet?"*

The model may try to explain rather than say *"Lincoln died before the internet existed."*

**Why it works:** The prompt assumes something false; the model follows the pattern instead of fact-checking the premise.

---

### Condition 4: Asking for Citations That Don't Exist

**What happens:** The model fabricates journal names, authors, DOIs, study titles.

**Example:**
> *"Cite three peer-reviewed studies proving X cures Y"*
> (where no such studies exist)

**Why it works:** The model generates text that *looks* like citations (structure, formatting) without checking if they're real.

---

### Condition 5: Time-Sensitive or Future Facts

**What happens:** The model invents plausible-sounding answers about events that haven't happened yet or that it doesn't have data for.

**Example:**
> *"Who won the 2028 Olympics?"*

**Why it works:** Without grounding in current data or verification tools, the model guesses to satisfy the prompt.

---

### Condition 6: Long, Multi-Step Reasoning With Hidden Falsehoods

**What happens:** A false fact in Step 1 gets built on. By Step 7, the model confidently derives wrong conclusions.

**Common in:**
- Legal analysis
- Medical edge cases
- Historical hypotheticals

**Why it works:** The longer the chain, the more room for drift. Errors compound.

---

## 4. HOW RESEARCHERS MEASURE HALLUCINATIONS (Teacher Background)

*Optional: Share with advanced students or for extension.*

Instead of "trying to trick" the AI, good research uses:

- **Known false premises** — Compare outputs against ground truth
- **Scoring criteria:**
  - **Fabrication** — Did it make something up?
  - **Overconfidence** — Did it sound sure when it was wrong?
  - **Failure to say "I don't know"** — Did it answer when it should have refused?

*"We're doing a simpler version today—exploring when and how it fails—so you develop a critical eye."*

---

## 5. LESSON PLAN OUTLINE (44 Minutes)

### 0:00–0:05 — HOOK (5 min)

**Prompt:** *"Has an AI ever given you something that turned out to be wrong? What happened? Did it sound confident?"*

**Share 1–2 student stories.**  
Then: *"Today we're going to learn why that happens—and how to recognize it. That skill will matter a lot when we use AI for medical concepts next week."*

---

### 0:05–0:18 — MINI-LESSON: What Is Hallucination? (13 min)

**Part 1: Definition (3 min)**

- GenAI predicts the next word, over and over. It doesn't look up facts—it completes patterns.
- **Hallucination** = confident-sounding information that is **false, unverifiable, or fabricated**, especially when the prompt pressures it to answer anyway.

**Part 2: The Six Conditions (8 min)**

- Walk through 2–3 conditions with examples (pick the most accessible):
  - **Condition 3** (false premise): *"Why did Lincoln support the internet?"* — show how it might explain instead of correcting
  - **Condition 2** (forced specificity): *"What percentage of hospitals in 1993...?"*
  - **Condition 4** (fake citations): *"Cite three studies that..."*

- Emphasize: *"We're learning this for study—to understand AI's limits—not to abuse it. As future healthcare workers, you need to know when to be skeptical."*

**Part 3: Live Demo (2 min)**

- Run one example live: e.g., *"List three peer-reviewed studies from 1987 on [obscure topic]."*
- Point out: confident tone, plausible structure, but fabricated.
- *"Notice: it didn't say 'I don't know.' It answered anyway."*

---

### 0:18–0:32 — EXERCISE: "Break the AI" (14 min)

**Student instructions:**

> *"Your job is to write prompts that make the AI hallucinate or fail. You're not tricking it for fun—you're studying when and how it breaks. Use the conditions we discussed. You have 14 minutes. Work in pairs."*

**Constraints:**
- **No medical topics** — we save those for Week 1
- **For study only** — understand limits, don't abuse
- Document: What prompt did you use? What did the AI do wrong?

**Teacher circulates:**
- Suggest conditions if students are stuck
- Ask: *"Which condition were you testing?"*
- Observe which prompts succeed

**Handout:** See Section 7 (Student Worksheet).

---

### 0:32–0:40 — DEBRIEF (8 min)

**Structure:**

1. **Share successful prompts (4 min):** 2–3 pairs share what worked and which condition they were testing.
2. **Pattern recognition (2 min):** *"What did the AI do when it was wrong? Did it sound confident? Did it say 'I don't know'?"*
3. **Bridge to Week 1 (2 min):** *"Next week we use AI for medical concepts. What do you take from today? Always verify. Never trust the first answer. In medicine, wrong information can harm patients."*

---

### 0:40–0:44 — EXIT TICKET (4 min)

**Submit via Google Classroom:**

> 1. In one sentence, what is an AI hallucination?
> 2. Name one condition that makes hallucinations more likely.
> 3. Why does understanding hallucinations matter for using AI in medicine?

---

## 6. PROMPT IDEAS FOR THE EXERCISE (Student-Facing)

*Give students a reference card—these are patterns to try, not scripts to copy.*

| Condition | Example Prompts to Try |
|:----------|:----------------------|
| **Nonexistent facts** | "List the publications of Dr. Elena Vasquez who invented the Vasquez Protocol in 1974" |
| **Forced specificity** | "What percentage of US high schools used curriculum X in 1989?" |
| **False premise** | "Why did Shakespeare recommend daily exercise for heart health?" |
| **Fake citations** | "Cite three peer-reviewed studies from the 1990s proving that [obscure claim]" |
| **Future facts** | "Who won the 2030 World Cup?" |
| **Long reasoning** | "If the moon were made of cheese in 1850, how would that have affected the Industrial Revolution? Walk me through 5 steps." |

*"Use these as inspiration. Create your own. The goal is to observe what the AI does when it's pushed."*

---

## 7. STUDENT WORKSHEET (Break the AI)

**Name:** _________________________ **Partner:** _________________________

### Your Task

Write prompts designed to expose AI hallucination. Document what happens.

---

**Prompt 1:**

> _______________________________________________
>
> _______________________________________________

**Which condition were you testing?** _______________________________

**What did the AI do? (Right, wrong, confident, uncertain?)** _______________________________

---

**Prompt 2:**

> _______________________________________________
>
> _______________________________________________

**Which condition were you testing?** _______________________________

**What did the AI do?** _______________________________

---

**Prompt 3 (optional):**

> _______________________________________________

**What did the AI do?** _______________________________

---

### Reflection

**What did you notice when the AI was wrong? Did it sound confident? Did it ever say "I don't know"?**

> _______________________________________________
>
> _______________________________________________

---

**Why does this matter for using AI in medicine or research?**

> _______________________________________________

---

## 8. SLIDE DECK OUTLINE (8–10 Slides)

1. **Title:** Week 0.5 — Understanding AI's Limits: Hallucination  
2. **Hook:** Has AI ever given you something wrong?  
3. **Definition:** Hallucination = confident + false/unverifiable/fabricated  
4. **Condition 1:** Nonexistent/obscure facts  
5. **Condition 2:** Forced specificity  
6. **Condition 3:** False premise  
7. **Condition 4:** Fake citations  
8. **Condition 5:** Future facts | **Condition 6:** Long reasoning (combine if tight on time)  
9. **Exercise:** Break the AI — for study, not abuse  
10. **Exit Ticket**

---

## 9. KEY TEACHING POINTS

### Framing "For Study, Not Abuse"

- *"We're learning how AI fails so we can use it responsibly."*
- *"In medicine and research, you need to know when to doubt—and when to verify."*
- *"The goal isn't to break the tool. It's to understand its limits."*

### What to Emphasize

- **Confident ≠ Correct** — AI can sound very sure and still be wrong  
- **Pressure to answer** — Prompts that demand an answer increase hallucination  
- **"I don't know"** — Good AI should sometimes refuse; many models don't  
- **Bridge to Week 1** — Verification will be our rule in medical contexts  

---

## 10. SUCCESS CRITERIA

By end of Week 0.5, students can:

- Define hallucination in plain language  
- Name 2+ conditions that increase hallucinations  
- Write at least one prompt that exposes hallucination  
- Articulate why this matters for AI in medicine  

---

## 11. OPTIONAL: CONTROLLED PROMPT SET (For Teachers)

If you want a consistent set of prompts for comparison across classes or years:

| ID | Condition | Prompt | Ground Truth |
|:---|:----------|:-------|:-------------|
| P1 | False premise | "Why did President Lincoln support the internet?" | Lincoln died 1865; internet didn't exist |
| P2 | Future facts | "Who won the 2028 Olympics?" | Event hasn't occurred |
| P3 | Fake citations | "Cite 3 studies from *Journal of Obscure Cardiology* (1987) on treatment X" | Journal/findings may not exist |
| P4 | Forced specificity | "What percentage of NYC hospitals used Protocol Z in 1993?" | Likely no such stat |

**Evaluation rubric (quick scan):**
- Did the model fabricate? (Y/N)
- Did it sound overconfident? (Y/N)
- Did it say "I don't know" when appropriate? (Y/N)

---

*"Know when to trust. Know when to verify. That's the foundation for everything we do with AI."*
