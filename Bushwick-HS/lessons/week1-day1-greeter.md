# WEEK 1 / DAY 1: THE GREETER
## Operation VIPER - Bushwick Leaders HS

**Date**: _______________  
**Duration**: 45 Minutes  
**Tool We're Building**: A Greeter Bot  

---

## LEARNING OBJECTIVES

By the end of this lesson, students will be able to:
1. Understand the "Spec-First" approach (think before you code)
2. Use `print()` to display text on screen
3. Use `input()` to capture what the user types
4. Store user input in a **variable**
5. Combine these to build a working "Greeter" tool

---

## MATERIALS NEEDED

- [ ] Projector / Screen for demos
- [ ] Replit classroom set up (or backup: Google Colab)
- [ ] Whiteboard/markers for Spec writing
- [ ] Exit ticket slips (or digital form)

---

## THE LESSON (45 Minutes)

---

### MINUTE 00-05: WARM-UP (5 min)

**Write on the board:**

> "What's the difference between a **tool** and a **toy**?"

**Discussion prompt** (2 min think, 3 min share):
- A toy entertains YOU
- A tool solves a PROBLEM for someone else
- This class? We build **tools**.

**Set the tone:**
> "In this class, you're not students. You're **Tool Builders**. Every day, we ship something that works."

---

### MINUTE 05-15: MINI-LESSON (10 min)

#### Part 1: Introduce the Spec-First Rule (3 min)

**Write on board:**

```
THE SPEC (before you touch the keyboard)
========================================
1. GOAL:       What does this tool DO?
2. INPUTS:     What does the user type?
3. OUTPUTS:    What does the screen show?
4. EDGE CASES: What could go wrong?
```

> "Before you write ONE line of code, you write the Spec. This is your blueprint. This is also your AI prompt if we use AI."

---

#### Part 2: Today's Tool - The Greeter (2 min)

**Live Demo - Write the Spec FIRST on the board:**

```
TOOL: The Greeter
=================
GOAL:       Ask the user their name, then greet them.
INPUTS:     User types their name.
OUTPUTS:    "Hello, [name]! Welcome to Operation VIPER."
EDGE CASES: (Skip for Day 1 - we'll add later)
```

---

#### Part 3: The Two Building Blocks (5 min)

**Concept 1: `print()` - The Mouth**

```python
print("Hello, world!")
```

> "This is how your program TALKS. Whatever's inside the parentheses and quotes shows up on screen."

**Live type it. Run it. Show the output.**

---

**Concept 2: `input()` - The Ears**

```python
name = input("What is your name? ")
```

> "This is how your program LISTENS. It waits for the user to type something, then stores it in a box called a **variable**."

**Explain the parts:**
- `name` = the box (variable) where we store the answer
- `input()` = the command that waits for typing
- `"What is your name? "` = the question shown to user

---

**Concept 3: Putting It Together**

```python
name = input("What is your name? ")
print("Hello, " + name + "! Welcome to Operation VIPER.")
```

**Live type. Run. Type your name. Show the output.**

> "That's it. That's the whole tool. Two lines. But it WORKS."

---

### MINUTE 15-35: BUILD TIME (20 min)

#### TRACK A (If AI/Internet works):
1. Students open Replit
2. Write their OWN Spec in comments at the top
3. Ask AI: "Write a Python greeter that asks for my name and says hello"
4. Run it. Debug if needed. Customize the greeting.

#### TRACK B (If AI blocked):
1. Students open Replit (or IDLE)
2. Write their OWN Spec in comments at the top
3. Hand-type the code from the board
4. Customize the greeting message

---

**CHALLENGE LEVELS** (for fast finishers):

| Level | Challenge |
|:------|:----------|
| **Bronze** | Change the greeting to something personal ("Yo, [name]!") |
| **Silver** | Ask TWO questions (name + favorite color), respond to both |
| **Gold** | Ask their age, then say "Wow, [age] is a great age to learn Python!" |

---

**Teacher Circulates:**
- Check that EVERY student has a Spec written (even if just one line)
- Help debug common issues:
  - Missing quotes
  - Missing parentheses
  - Forgetting the `=` in variable assignment

---

### MINUTE 35-42: SHOW & TELL (7 min)

**Pick 2 students to demo on the projector.**

Questions for the class:
1. "What's the GOAL of their tool?"
2. "What INPUTS does it take?"
3. "What OUTPUTS does it show?"
4. "Can anyone spot a bug or suggest an improvement?"

> Celebrate the work. Even if it's just two lines - it RUNS.

---

### MINUTE 42-45: EXIT TICKET (3 min)

**Students submit (on paper or digitally):**

```
EXIT TICKET - Day 1
===================
1. What does print() do?

2. What does input() do?

3. Write the SPEC for a tool that asks someone 
   their favorite food and responds.
   
   GOAL: 
   INPUTS: 
   OUTPUTS:
```

---

## QUICK REFERENCE CARD (For Students)

```python
# THE GREETER - My First Tool

# === MY SPEC ===
# GOAL: Ask user's name, greet them
# INPUT: User types name
# OUTPUT: Greeting with their name

# === MY CODE ===
name = input("What is your name? ")
print("Hello, " + name + "!")
```

---

## COMMON ERRORS TO WATCH FOR

| Error | What They Typed | Fix |
|:------|:----------------|:----|
| SyntaxError | `print("hello)` | Missing closing quote |
| SyntaxError | `print "hello"` | Missing parentheses |
| NameError | `print(hello)` | Forgot quotes around text |
| Nothing happens | `input("name")` | Forgot to store in variable |

---

## TEACHER NOTES

**If students finish early:**
- Pair them with struggling students
- Challenge them to "break" their own code (type weird inputs)
- Have them write a Spec for tomorrow's tool

**Preparation for Day 2:**
- Tomorrow we add `if/else` (Right/Wrong judging)
- Tease: "Tomorrow your Greeter becomes a QUIZ. It judges you."

---

## SUCCESS CRITERIA

By end of Day 1, every student should have:
- [ ] Written at least a 1-line Spec
- [ ] A working 2-line program that runs
- [ ] Submitted an Exit Ticket
- [ ] Understanding that **Spec comes before Code**

---

*"A coder who can't write a Spec is just a typist. Be an Architect."*
