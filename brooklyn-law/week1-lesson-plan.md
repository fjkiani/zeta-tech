# Week 1: Intro to Machine Learning
## Brooklyn HS of Law & Technology — "AI, Justice, and Data"
## Instructor: Fahad J. Kiani 

**Duration**: 50 minutes | **Theme**: How Algorithms Shape Decisions

---

## 1. LEARNING OBJECTIVES

| # | Learning Objective | Bloom's Level | How Assessed |
|---|--------------------|---------------|--------------|
| 1 | Explain machine learning in plain language as "pattern-finding from examples, not programming rules" | Understand | Exit ticket; think-pair-share |
| 2 | Identify 2–3 real-world decisions made by ML systems (at least one from law/justice) | Remember / Apply | Guided practice handout; debrief share-out |
| 3 | Describe the Ask → Verify → Refine workflow and why verification matters when using AI | Understand | Mini-lesson check; exit ticket |
| 4 | Write one clear prompt asking an AI to explain an ML concept, then evaluate the response for accuracy | Apply / Analyze | Guided practice; observation |
| 5 | Articulate one ethical concern about ML decision-making (bias, fairness, transparency, or accountability) | Analyze | Debrief discussion; exit ticket |

---

## 2. LESSON PLAN OUTLINE

### 0:00–0:10 — HOOK + CASE INTRO (10 min)

**Scenario: "The Bail Algorithm"**

> *"A judge in Wisconsin is about to decide whether someone gets bail or stays in jail. On the desk: a score from 1–10. The score came from a computer program, not from the judge. The program looked at data about this person—age, zip code, past arrests—and predicted: 'How likely is this person to commit another crime?' That prediction influences who goes home and who waits in jail. Who wrote the rules for that? Nobody did. A machine learned them from examples."*

**Discussion prompts:**
- What do you think that program looked at to make its prediction?
- Who might benefit from this? Who might be harmed?
- If you were the defendant’s lawyer, what would you want to know about that score?

**Transition:** *"That program is one form of machine learning. Today we’re going to learn what ML actually is, where it shows up, and why we have to ask hard questions about it."*

---

### 0:10–0:25 — MINI-LESSON + DEMO (15 min)

**Core content:**

1. **Traditional programming vs. machine learning** (4 min)  
   - Traditional: human writes rules → computer follows them  
   - ML: human gives examples → computer finds patterns → computer writes its own rules  
   - Analogy: "Recipe vs. Taste test"—a recipe tells you exactly what to do; ML learns from many taste tests what “good” looks like.

2. **Supervised learning in plain language** (4 min)  
   - **Examples** = past cases (inputs + outcomes)  
   - **Features** = what we feed in (e.g., zip code, age, number of arrests)  
   - **Labels** = what we’re trying to predict (e.g., reoffend: yes/no)  
   - One phrase: *"Show me enough examples, I’ll guess what happens next."*

3. **Where ML is already used** (4 min)  
   - Law/justice: risk scores (bail, parole), facial recognition, content moderation  
   - Everyday: recommendations, spam filters, autocomplete  
   - Point: *"It’s already deciding things. The question is whether we trust it."*

4. **Ask → Verify → Refine** (3 min)  
   - **Ask:** Clear question to an AI tool  
   - **Verify:** Check the answer—does it make sense? Is it accurate?  
   - **Refine:** If it’s wrong or vague, ask again in a better way  
   - Emphasize: *"Never take the first answer as fact. Always verify."*

**Demo (if AI available):**  
Ask an AI: *"Explain machine learning in one sentence for a high school student."*  
Then ask the class: *"How would we check if that’s right?"* —model the verification step.

---

### 0:25–0:40 — GUIDED PRACTICE (15 min)

**Activity: "Interrogate the Algorithm"**

Students work in pairs with the **Student Handout** (see Section 5). Tasks:

1. **Prompt writing** (5 min): Write a clear prompt asking an AI to explain one concept from today (e.g., "What is a feature in machine learning?" or "How does COMPAS work?").  
   - If AI is available: run the prompt and read the answer.  
   - If blocked: use the teacher’s demo or a provided sample response.

2. **Verification** (5 min): Evaluate the AI’s answer. Is it accurate? Clear? Missing something? Write one thing you’d double-check.

3. **Ethics scenario** (5 min): With a partner, discuss: *"A school district wants to use ML to flag ‘at-risk’ students based on attendance and grades. What’s one way this could help? One way it could harm? What would you want to know before trusting it?"*  
   Jot down 2–3 bullets to share.

**Teacher circulates:**  
Check prompt clarity, encourage verification questions, and support pairs who are stuck on the ethics discussion.

---

### 0:40–0:48 — DEBRIEF / SHARE-OUT (8 min)

**Structure:**

1. **Prompt + Verification** (4 min): 2–3 pairs share their prompt and whether they trusted the AI’s answer. What would they verify?

2. **Ethics scenario** (4 min): 2–3 pairs share one benefit and one harm of the “at-risk” student algorithm.  
   - Push for: *"Accuracy isn’t the same as fairness. A system can be right on average and still hurt some groups more than others."*

**Closure:**  
*"You’re not just AI users—you’re interrogators. Every time you see an algorithm making a decision, ask: What went in? What came out? Who does this help? Who does it hurt?"*

---

### 0:48–0:50 — EXIT TICKET (2 min)

Students submit via Google Classroom (exact wording in Section 4).

---

## 3. SLIDE DECK OUTLINE (12 slides)

### Slide 1: Title
- **Title:** AI, Justice, and Data: How Algorithms Shape Decisions  
- **Subtitle:** Week 1 — What is Machine Learning?  
- **Visual:** Simple image of a scale of justice + abstract data/circuit motif  
- **Notes:** Welcome students. *"Today we start asking hard questions about the tech that’s already deciding things in our lives."*

---

### Slide 2: The Scenario
- **Title:** Before We Define Anything… A Scenario  
- **Bullets:**
  - A judge has to decide: bail or jail?
  - A computer gives a score 1–10
  - The score predicts: "How likely to reoffend?"
  - That score affects the decision
- **Visual:** Photo or illustration of a courtroom; or diagram of judge + computer screen  
- **Notes:** Read the scenario. Pause. *"Take 30 seconds: what would you want to know about that score if you were the lawyer?"*

---

### Slide 3: Think-Pair-Share (Interactive)
- **Title:** Turn to a Partner  
- **Prompt:** *"If you were the defendant’s lawyer, what would you demand to know about how that score was calculated?"*  
- **Visual:** Discussion icon or courtroom  
- **Notes:** Give 2 min. Call on 2–3 pairs. Common answers: What data? Who made it? Is it fair? Can we see the code?

---

### Slide 4: Two Ways to Get a Computer to Decide
- **Title:** Rules vs. Patterns  
- **Left column — Traditional Programming:**
  - Human writes the rules
  - Computer follows them exactly
  - Example: "If score > 7, deny bail"
- **Right column — Machine Learning:**
  - Human gives examples (data)
  - Computer finds patterns
  - Computer writes its own rules
  - Example: "I’ve seen 10,000 cases; here’s what usually happens"
- **Visual:** Side-by-side diagram: Human → Rules → Computer vs. Human → Data → Computer → Patterns  
- **Notes:** *"ML doesn’t need a human to program every rule. It learns from examples."*

---

### Slide 5: The Core Idea
- **Title:** Machine Learning in One Sentence  
- **Bullet:** Machine learning = **finding patterns in data to make predictions**, instead of a human writing every rule.  
- **Visual:** Simple flowchart: Data → Patterns → Predictions  
- **Notes:** *"Remember this sentence. It’s your plain-language definition."*

---

### Slide 6: Features and Labels (Plain Language)
- **Title:** What Goes In, What Comes Out  
- **Bullets:**
  - **Features** = inputs (what we know: zip code, age, past arrests, etc.)
  - **Labels** = outcomes (what we’re predicting: reoffend? yes or no)
  - The machine learns: "When I see these features, this label usually follows"
- **Visual:** Diagram: [Features] → [???] → [Label]  
- **Notes:** *"No math. Just: inputs go in, prediction comes out."*

---

### Slide 7: Where Is ML Already Making Decisions?
- **Title:** It’s Not Science Fiction—It’s Here  
- **Bullets:**
  - Bail & parole risk scores (e.g., COMPAS)
  - Facial recognition (airports, some schools)
  - Content moderation (what gets removed online)
  - Hiring algorithms (who gets an interview)
  - Recommendations (what you see on TikTok, Netflix)
- **Visual:** Icons for each category  
- **Notes:** *"Which of these have you personally encountered? Which affect law and justice?"*

---

### Slide 8: Ask → Verify → Refine
- **Title:** Your Workflow When Using AI  
- **Bullets:**
  - **Ask:** Write a clear question
  - **Verify:** Don’t assume the answer is right—check it
  - **Refine:** If it’s wrong or unclear, ask again
- **Visual:** Circular diagram or 3-step flowchart  
- **Notes:** *"This is our rule for the whole semester. Verify everything."*

---

### Slide 9: Demo (If AI Accessible)
- **Title:** Let’s Try It  
- **Content:** Live prompt: *"Explain machine learning in one sentence for a high school student."*  
- **Visual:** Screenshot or live AI interface  
- **Notes:** Run the prompt. Then: *"How would we verify this answer? What would we double-check?"*

---

### Slide 10: Accuracy ≠ Fairness
- **Title:** One Critical Idea  
- **Bullet:** A system can be "accurate" overall and still be **unfair** to certain groups.  
- **Example:** A risk score might be right 70% of the time but wrong much more often for one race or neighborhood.  
- **Visual:** Simple scale or balance  
- **Notes:** *"Fairness is a separate question from accuracy. We’ll come back to this."*

---

### Slide 11: Guided Practice — Your Turn
- **Title:** Interrogate the Algorithm  
- **Bullets:**
  - Write a prompt asking AI to explain one ML concept
  - Verify the answer—what would you check?
  - Discuss with a partner: the "at-risk students" scenario
- **Visual:** Handout preview or worksheet icon  
- **Notes:** *"You’ll use the handout. I’ll circulate. Be ready to share."*

---

### Slide 12: Exit Ticket
- **Title:** Before You Go  
- **Content:** Display the exit ticket question (see Section 4)  
- **Notes:** *"Submit this on Google Classroom before you leave."*

---

## 4. EXIT TICKET QUESTION

**Exact wording for Google Classroom:**

---

> **Exit Ticket — Week 1**
>
> In 2–3 sentences, answer:
>
> 1. What is machine learning in plain language?
> 2. Name one place (from today’s lesson or your own life) where an algorithm or AI is already making a decision.
> 3. Why does "Verify" matter in the Ask → Verify → Refine workflow?
>
> Submit before you leave.

---

## 5. STUDENT HANDOUT DESCRIPTION

**Title:** Week 1 — Interrogate the Algorithm  
**Format:** 1 page, printable or digital (Google Doc)

---

### Part 1: Prompt Writing (5 min)

**Instructions:** Write a clear prompt asking an AI to explain ONE of these concepts:
- What is a "feature" in machine learning?
- What is a "label" in machine learning?
- How does a tool like COMPAS work?

**Template:**
> My prompt: _______________________________________________
>
> If you got an answer: Was it clear? Accurate? What would you double-check?
> _______________________________________________

---

### Part 2: Ethics Scenario — Discuss with a Partner (5 min)

**Scenario:** A school district wants to use ML to flag "at-risk" students based on attendance, grades, and behavior reports. The goal is to offer extra support early.

**Discuss:**
1. One way this could **help**:
2. One way this could **harm**:
3. What would you want to know before trusting this system?

**Space for notes:**
- _______________________________________________
- _______________________________________________
- _______________________________________________

---

### Part 3: Share-Out Prep (2 min)

**Be ready to share:**
- Your prompt (or your partner’s)
- One benefit and one harm from the scenario
- One thing you’d verify about an AI’s answer

---

**Optional addition:** Provide a sample AI response (2–3 sentences) explaining "feature" or "label" so students can practice verification even if live AI is blocked.

---

## SUCCESS CRITERIA

A student has succeeded in Week 1 if they can say:

> *"Machine learning finds patterns in data to make predictions. It’s used in [bail risk scores / facial recognition / recommendations / etc.], and we need to check if it’s fair—because accuracy isn’t the same as fairness."*

---

*"Every model is a witness. Cross-examine it."*
