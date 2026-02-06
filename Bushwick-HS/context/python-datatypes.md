# Python 3: Data Types and Input/Output – The Ultimate Beginner's Guide
Target Audience: High school juniors/seniors at HS of Law & Technology, NYC
Duration: 50 minutes
Learning Philosophy: "Code is a conversation between you and the computer. Learn its language."

## Course Overview & Mission
By the end of this lesson, students will be able to:
- Store and manipulate different types of data (numbers, text) in Python
- Use variables as labeled storage boxes in computer memory
- Get input from users and display output to the screen
- Build a working "Age Calculator" that converts age into decades and years
- Debug common errors (type mismatches, concatenation issues)

Core Workflow: Input → Process → Output (the foundation of EVERY program ever written)

## Why This Matters: The Real-World Hook
Opening Scenario (5 min): "The $300 Million Typo"
Teacher Script:
"In 1999, NASA lost a $125 million Mars orbiter because one team used metric units (meters) and another used imperial units (feet). The spacecraft burned up in Mars' atmosphere. Why? A data type mismatch—the computer expected one type of number but got another.

Today you're learning the building blocks that prevent disasters like this: data types, variables, and input/output. These aren't just Python concepts—they're how ALL software works, from TikTok to legal databases to SpaceX rockets."

## Part 1: Variables – Your Computer's Memory Boxes
Analogy: "Your computer's memory is like a warehouse full of labeled boxes. A variable is a labeled box where you store a value."

Live Demo (Python Shell):
```python
length = 10
width = 20
area = length * width
# area is 200
```
Key Insight: The computer remembers these values for you.

## Part 2: Primitive Data Types – Python's Building Blocks
"INT-FLOAT-STRING" (say it like a spell):

- **int**: Whole numbers (no decimals). Example: `age = 17`. Memory Trick: "INTegers are INTact"
- **float**: Decimal numbers. Example: `price = 9.99`. Memory Trick: "Decimals FLOAT"
- **string**: Text. Example: `name = "Maya"`. Memory Trick: "STRING together letters"

Python's Superpower: Type Inference. It guesses the type based on value.

## Part 3: Arithmetic Operators
+ (Add), - (Sub), * (Mult), / (Div - always float), // (Integer Div), % (Modulo - remainder).
Pro Tip for Age Calculator:
- Decades: `age // 10`
- Leftover years: `age % 10`

## Part 4: Output – print()
`print(total)` shows the *value*. `print("total")` shows the *word*.

## Part 5: Strings – Storing Text
Single or Double quotes work.
Concatenation (`+`): "glue" for strings.
`greeting = "Hello " + name`

## Part 6: Input – input()
`name = input("Promt")`
*Always returns a string!*

## Part 7: Type Conversion
Problem: `input()` gives a string "17". We can't divide a string.
Fix: `age = int(age)`
- `int(x)`: String to Integer
- `float(x)`: String to Float
- `str(x)`: Number to String

## Part 8: The Age Calculator (Final Project)
```python
# Age Calculator
age = input("How old are you?\n")
age = int(age)

decades = age // 10
years = age % 10

decades = str(decades)
years = str(years)

print("You are " + decades + " decades and " + years + " year(s) old.")
```

## Common Errors / Debugging
1. **TypeError**: Concatenating string + number. Fix: `str(number)`.
2. **Division Error**: Dividing string by int. Fix: `int(string)`.
3. **Quote Mismatch**: `name = 'Alice"` (SyntaxError). Fix: Match quotes.

## Quiz Data Types Master Challenge
Q1: What type is `amount = 42`? (int)
Q2: Output of `print("5" + "5")`? ("55")
Q3: `input()` returns? (string)
Q4: `17 // 5`? (3)
Q5: `17 % 5`? (2)
