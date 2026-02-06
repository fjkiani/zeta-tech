
# Lesson: Python 3: Data Types and Input/Output – Intro - Week 0.5

## Description
[object Object]

## Lesson Plan



# Python 3: Data Types and Input/Output – The Ultimate Beginner's Guide

**Target Audience:** High school juniors/seniors at HS of Law & Technology, NYC  
**Duration:** 50 minutes  
**Learning Philosophy:** *"Code is a conversation between you and the computer. Learn its language."*

---

## Course Overview & Mission

By the end of this lesson, students will be able to:

- Store and manipulate different types of data (numbers, text) in Python
- Use variables as **labeled storage boxes** in computer memory
- Get input from users and display output to the screen
- Build a working **Age Calculator** that converts age into decades and years
- Debug common errors (type mismatches, concatenation issues)

**Core Workflow:** Input → Process → Output *(the foundation of EVERY program ever written)*

---

## Why This Matters: The Real-World Hook

### Opening Scenario (5 min): "The $300 Million Typo"

> In 1999, NASA lost a $125 million Mars orbiter because one team used metric units (meters) and another used imperial units (feet). The spacecraft burned up in Mars' atmosphere. **Why?** A data type mismatch—the computer expected one type of number but got another.
>
> Today you're learning the building blocks that prevent disasters like this: **data types**, **variables**, and **input/output**. These aren't just Python concepts—they're how ALL software works, from TikTok to legal databases to SpaceX rockets.

**Think-Pair-Share:**

> Where else could mixing up data types cause problems? *(Think: money, medical doses, court records, GPS coordinates...)*

---

## The Big Picture: What You're Building Today

### The Age Calculator Challenge

**Demo** (show completed program running):

```text
> How old are you?
> 202
> You are 20 decades and 2 year(s) old.
```

> By the end of today, you'll build this. It looks simple, but it teaches you the **5 fundamental skills** of programming:
>
> 1. Ask the user for input
> 2. Save input to a variable
> 3. Calculate (do math with the data)
> 4. Convert between data types
> 5. Print the result to the screen
>
> These 5 steps? That's **90% of what software does.** Master this, and you can build anything.

---

## Part 1: Variables – Your Computer's Memory Boxes

### The Memory Model (Make It Visual)

> Your computer's memory is like a **warehouse full of labeled boxes**. A variable is a labeled box where you store a value. The label is the variable name, and what's inside is the value.

**Live Demo (Python Shell):**

```python
>>> length = 10
```

**Visual on slide:**

```text
┌─────────┐
│   10    │  ← value
└─────────┘
   length   ← label (variable name)
```

> Now there's a box in memory labeled `length` storing the number 10. Anywhere in your code, when you type `length`, Python looks up that box and gets the value 10.

### Building Up: Multiple Variables

```python
>>> length = 10
>>> width = 20
>>> area = length * width
>>> area
200
```

**Visual (show 3 memory boxes):**

```text
┌─────────┐  ┌─────────┐  ┌─────────┐
│   10    │  │   20    │  │   200   │
└─────────┘  └─────────┘  └─────────┘
  length       width        area
```

> The computer remembers these values for you. You don't have to hold `length` and `width` in your head—**the computer does it. That's the superpower of variables.**

---

## Part 2: Primitive Data Types – Python's Building Blocks

### The Three Core Types (Memory Trick)

*"INT-FLOAT-STRING" (say it like a spell)*

| Type | What It Stores | Example | Memory Trick |
|------|----------------|---------|--------------|
| `int` | Whole numbers (no decimals) | `age = 17` | **INT**egers are **INT**act (no pieces) |
| `float` | Decimal numbers | `price = 9.99` | Decimals **FLOAT** (they have a point that moves) |
| `string` | Text (letters, words) | `name = "Maya"` | **STRING** together letters like beads on a string |

### Python's Superpower: Type Inference

> Unlike some languages, Python is smart. It **infers** (guesses) the type based on what you assign.

```python
>>> amount = 10        # Python: "That's an int!"
>>> amount = 10.50     # Python: "That's a float!"
>>> amount = "ten"     # Python: "That's a string!"
```

> You don't have to tell Python the type—it figures it out. But **you** need to know what type your data is, because different types behave differently.

---

## Part 3: Arithmetic Operators – Do the Math

### The Calculator in Your Code

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `+` | Addition | `10 + 5` | 15 |
| `-` | Subtraction | `10 - 5` | 5 |
| `*` | Multiplication | `10 * 5` | 50 |
| `/` | Division | `10 / 5` | 2.0 *(always float!)* |
| `//` | Integer Division | `10 // 3` | 3 *(no remainder)* |
| `%` | Modulo (remainder) | `10 % 3` | 1 |

**Pro Tip for Age Calculator:**

> - To find **decades:** `age // 10` (integer division)
> - To find **leftover years:** `age % 10` (modulo gives remainder)

---

## Part 4: Output – Talking to the User with print()

### The print() Function Anatomy

```python
print(total)
  ↑     ↑
function  argument
 name
```

> Think of `print()` as a **machine**. You don't need to know HOW it works inside. You just know: put something in (the argument), and it displays on screen.

**Example (sales_tax.py):**

```python
amount = 10
tax = 0.06
total = amount + amount * tax
print(total)  # Output: 10.6
```

**Common Beginner Mistake:**

```python
print(total)     # ✅ Correct – prints the VALUE
print("total")   # ❌ Wrong – prints the WORD "total"
```

---

## Part 5: Strings – Storing Text

### Creating Strings (Single vs Double Quotes)

**Rule:** Single `'` or double `"` quotes both work. Pick one and be consistent.

```python
name = 'Alice'        # ✅ Works
name = "Alice"        # ✅ Also works
name = "Alice's Lab"  # ✅ Double quotes let you use ' inside
```

**Common Error:**

```python
name = 'Alice's Lab'  # ❌ ERROR – Python thinks string ends at second '
```

### String Concatenation (The Smush)

*Concatenate* = Fancy word for "join together"

```python
hello = "Hello"
name = "Sarah"
greeting = hello + name
print(greeting)  # Output: HelloSarah (no space!)
```

**Fix it:**

```python
greeting = hello + " " + name
print(greeting)  # Output: Hello Sarah ✅
```

> The `+` operator is like **glue**. For numbers, it adds. For strings, it sticks them together.

---

## Part 6: Input – Listening to the User with input()

### The input() Function Anatomy

```python
name = input("What's your name?\n")
       ↑          ↑
    function    prompt message
```

**What Happens:**

1. Python prints the message: *What's your name?*
2. Program pauses and waits for user to type + press Enter
3. Whatever user types gets saved to variable `name`

**Special Character Alert:**

```python
input("What's your name?\n")
                        ↑
                    new line character
```

- **Before `\n`:** `What's your name?Bob`
- **After `\n`:** `What's your name?` then new line, then `Bob`

> The `\n` moves the cursor to the next line. It's invisible but powerful.

---

## Part 7: Type Conversion – Changing Data Types

### The Problem: input() Always Returns a String

```python
age = input("How old are you?\n")  # User types: 17
decades = age // 10  # ❌ ERROR: can't divide string by int
```

### The Fix: Convert string to int

```python
age = input("How old are you?\n")  # User types: 17 (stored as "17")
age = int(age)                     # Convert "17" → 17
decades = age // 10                # ✅ Now math works
```

### Conversion Functions Cheat Sheet

| Function | Converts To | Example |
|----------|-------------|---------|
| `int(x)` | Integer | `int("17")` → 17 |
| `float(x)` | Float | `float("9.99")` → 9.99 |
| `str(x)` | String | `str(17)` → `"17"` |

> - To go from **string → number:** `int()` or `float()`
> - To go from **number → string:** `str()`

---

## Part 8: Putting It All Together – The Age Calculator

### Step-by-Step Build (Live Coding)

**Step 1:** Get user input

```python
age = input("How old are you?\n")
```

**Step 2:** Convert to int (so we can do math)

```python
age = int(age)
```

**Step 3:** Calculate decades and years

```python
decades = age // 10  # Integer division
years = age % 10     # Modulo (remainder)
```

**Step 4:** Convert numbers back to strings (so we can concatenate)

```python
decades = str(decades)
years = str(years)
```

**Step 5:** Print the result

```python
print("You are " + decades + " decades and " + years + " year(s) old.")
```

### Full Program (age_calculator.py)

```python
# Age Calculator – Converts age to decades and years

age = input("How old are you?\n")
age = int(age)

decades = age // 10
years = age % 10

decades = str(decades)
years = str(years)

print("You are " + decades + " decades and " + years + " year(s) old.")
```

**Run it:**

```text
> python3 age_calculator.py
How old are you?
202
You are 20 decades and 2 year(s) old.
```

---

## Breakout Session 1: Debug the Broken Code (10 min)

### Instructions

> Here are 5 broken Python programs. Each has **ONE** error related to data types, input/output, or variables. Find the bug and fix it.

**Handout:** "Bug Hunt Worksheet"

### Bug #1: Type Mismatch

```python
age = input("Your age: ")
next_year = age + 1  # ❌ What's wrong?
print(next_year)
```

**Fix:** Convert input to int: `age = int(age)`

### Bug #2: String Concatenation Error

```python
price = 9.99
message = "Total: $" + price  # ❌ What's wrong?
print(message)
```

**Fix:** Convert float to string: `"Total: $" + str(price)`

### Bug #3: Variable Not Defined

```python
length = 10
area = length * width  # ❌ What's wrong?
print(area)
```

**Fix:** Define `width` before using it: `width = 20`

### Bug #4: Quote Mismatch

```python
store = 'Joe's Pizza'  # ❌ What's wrong?
print(store)
```

**Fix:** Use double quotes: `store = "Joe's Pizza"`

### Bug #5: Division by Zero (Bonus)

```python
total = 100
count = 0
average = total / count  # ❌ What happens?
print(average)
```

**Fix:** Check if `count` is zero before dividing

---

## Breakout Session 2: Build Your Own Calculator (15 min)

### Challenge Options (Choose Your Difficulty)

**Level 1: Temperature Converter**
- Ask user for temperature in Fahrenheit
- Convert to Celsius: `C = (F - 32) * 5/9`
- Print result

**Level 2: Simple Budget Tracker**
- Ask for income
- Ask for expenses
- Calculate savings: income - expenses
- Print whether you're in the red or black

**Level 3: Legal Age Checker**
- Ask for birth year
- Calculate age: `2026 - birth_year`
- Print whether they can vote (18+), drink (21+), or run for Congress (25+)

---

## Quiz: Data Types Master Challenge (5 min)

*Kahoot-Style Questions (or Google Form)*

| # | Question | Answer |
|---|----------|--------|
| Q1 | What type is this? `amount = 42` | **A) int** ✅ |
| Q2 | What's the output? `print("5" + "5")` | **B) 55** ✅ |
| Q3 | What does `input()` always return? | **C) string** ✅ |
| Q4 | What's `17 // 5`? | **B) 3** ✅ |
| Q5 | Fix this: `age = input("Age: ")` then `print(age + 1)` | **A) age = int(age)** ✅ |
| Q6 | What's `17 % 5`? | **B) 2** ✅ |
| Q7 | Which creates a valid string? | **A) name = "Sara's Deli"** ✅ |
| Q8 | What prints? `x = 10; y = "10"; print(x + y)` | **D) Error** ✅ |

---

## Homework: The Ultimate Calculator

### Assignment: "My First Useful Program"

Build **ONE** of these calculators (or invent your own):

**Tip Calculator**
- Input: Bill amount
- Calculate: 15%, 18%, and 20% tip options
- Output: *"For a $50 bill, tip options are: $7.50, $9.00, $10.00"*

**Study Time Planner**
- Input: Hours available, number of subjects
- Calculate: Minutes per subject
- Output: *"Study [X] minutes per subject"*

**Carbon Footprint (Subway vs Uber)**
- Input: Miles traveled
- Calculate: CO2 for subway (0.14 kg/mile) vs Uber (0.41 kg/mile)
- Output: *"Subway: X kg CO2, Uber: Y kg CO2, You saved Z kg"*

### Requirements

- Use `input()` for user interaction
- Use at least **3 variables**
- Perform calculations with operators
- Convert between int/float/string as needed
- Use `print()` with string concatenation
- Add **comments** explaining your code

### Bonus (+10 points)

- Add input validation (what if user enters negative numbers?)
- Use `\n` for formatted multi-line output
- Include your school name/class period in the output

---

## Summary: The 5 Building Blocks You Just Mastered

### Core Concepts Recap

1. **Variables = Memory Labels**
   ```python
   length = 10  # Box labeled "length" stores 10
   ```

2. **Three Data Types:** `int` → whole numbers | `float` → decimals | `string` → text

3. **Operators:** Math: `+ - * / // %` | String glue: `+` (concatenation)

4. **Output**
   ```python
   print(value)  # Display to screen
   ```

5. **Input**
   ```python
   variable = input("Prompt")  # Get user input (always string!)
   ```

6. **Type Conversion**
   ```python
   int(x)    # → integer
   float(x)  # → decimal
   str(x)    # → string
   ```

---

## Teacher Notes: Common Student Struggles & Fixes

### Error #1: "TypeError: can only concatenate str to str"

```python
age = 17
print("You are " + age)  # ❌ ERROR
```

**Fix:** Convert int to string: `print("You are " + str(age))`

> The `+` operator is like glue. But you can't glue text to a number—you must convert the number to text first.

### Error #2: "TypeError: unsupported operand type(s) for //: 'str' and 'int'"

```python
age = input("Age: ")  # Returns string "17"
decades = age // 10   # ❌ Can't divide string
```

**Fix:** Convert input: `age = int(age)`

> `input()` always gives you a string, even if the user types numbers. You must convert before doing math.

### Error #3: Quote Confusion

```python
name = "Alice   # ❌ Missing closing quote
```

**Fix:** Close the quote: `name = "Alice"`

> Strings need TWO quotes—one to open, one to close. Like parentheses in math.

---

## Visual Cheat Sheet (Print This for Students)

```text
┌─────────────────────────────────────────────┐
│         PYTHON DATA TYPES CHEAT SHEET       │
├─────────────────────────────────────────────┤
│ TYPE    │ EXAMPLE        │ MEMORY TRICK     │
├─────────┼────────────────┼──────────────────┤
│ int     │ age = 17       │ INTact numbers   │
│ float   │ price = 9.99   │ Point FLOATs     │
│ string  │ name = "Maya"  │ STRING letters   │
└─────────┴────────────────┴──────────────────┘

┌─────────────────────────────────────────────┐
│              INPUT/OUTPUT                 │
├─────────────────────────────────────────────┤
│ input("message")  → Get user input (string) │
│ print(value)      → Display on screen      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            TYPE CONVERSION                  │
├─────────────────────────────────────────────┤
│ int("17")    → 17        (string to int)    │
│ float("9.5") → 9.5       (string to float)  │
│ str(17)      → "17"      (int to string)    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              OPERATORS                      │
├─────────────────────────────────────────────┤
│ +   add/concatenate  │ 10 + 5 = 15         │
│ -   subtract         │ 10 - 5 = 5          │
│ *   multiply         │ 10 * 5 = 50         │
│ /   divide           │ 10 / 5 = 2.0        │
│ //  integer divide   │ 17 // 10 = 1        │
│ %   modulo/remainder │ 17 % 10 = 7         │
└─────────────────────────────────────────────┘
```

---

## Success Criteria

If a student leaves able to:

- ✅ Explain what a variable is (*"a labeled box in memory"*)
- ✅ Name the 3 primitive types (int, float, string)
- ✅ Write a program that gets input, does calculation, prints output
- ✅ Debug type conversion errors
- ✅ Build the Age Calculator without help

**…then you've succeeded.** 🎯




## Transcript/Video Context
(See video source)
         