# How to Talk to Computers (Without Crashing Spacecraft): A High Schooler's Guide to Python Data Types, Variables, and I/O

### 1. Introduction: The $300 Million Typo and Why Data Types Matter

In 1999, NASA lost a $125 million Mars orbiter because one engineering team calculated force using metric units (Newton-seconds) while another used imperial units (pound-force seconds). The spacecraft flew too close to Mars and burned up in the planet's atmosphere—all because of a data mismatch where the flight software received one type of value when it expected another. 

For students here at Bushwick High School of Law & Technology, this famous story—often called the "$300 Million Typo"—is the ultimate proof that understanding data types, variables, and Input/Output (I/O) isn't just dry textbook theory. It's the engine behind all software on the planet! Whether you want to build the next viral algorithm for TikTok, construct secure databases for legal tech, or write navigation systems for SpaceX rockets, these exact building blocks are what keep your code running safely. 

As we jump into Python today, keep our core lesson philosophy posted right on your mental dashboard: *"Code is a conversation between you and the computer. Learn its language."*

---

### 2. Variables: Your Computer's Memory Boxes

Imagine your computer's memory as a giant, hyper-organized warehouse filled with labeled storage boxes. In programming, a **variable** is simply one of those labeled boxes. You pick a name for the box, put a piece of data inside, and Python holds onto it so you can use it later in your code.

Check out how we create and use variables in Python:

```python
length = 10
width = 20
area = length * width
```

Here's what happens behind the scenes:
1. Python creates a box named `length` and drops the number `10` inside.
2. It creates a second box named `width` and puts `20` inside.
3. When it reaches `area = length * width`, Python looks inside the `length` box, retrieves `10`, looks inside the `width` box, retrieves `20`, multiplies them together, and puts the result (`200`) into a brand-new box labeled `area`.

The computer handles all the memory tracking automatically. Once a value is stored in a variable, you can call on it anytime!

---

### 3. Primitive Data Types: The "Big Three" Building Blocks

Before you put data into a memory box, you need to know what kind of data you're working with. In Python, we rely heavily on three fundamental "primitive" data types. To memorize them fast, repeat this chant: *"INT-FLOAT-STRING" (say it like a spell!)*.

| Data Type | What It Stores | Example | Memory Trick |
| :--- | :--- | :--- | :--- |
| **`int`** | Whole numbers (no decimals) | `age = 17` | *"INTegers are INTact"* |
| **`float`** | Decimal numbers | `price = 9.99` | *"Decimals FLOAT"* |
| **`string`** | Text enclosed in quotes | `name = "Maya"` | *"STRING together letters"* |

#### Python's Superpower: Type Inference
In many older programming languages, you had to explicitly tell the computer the data type before creating a variable. But Python has a superpower called **Type Inference**. Python automatically inspects the value you provide and guesses the correct data type instantly!

Compare these two lines:

```python
# Python infers this is an integer (int) because there are no quotes or decimals
age = 17

# Python infers this is a string (str) because it is surrounded by quotation marks
age = "17"
```

Notice the difference? To Python, `17` (without quotes) is a mathematical number you can add or multiply, while `"17"` (with quotes) is just text, like a house address or a jersey number.

---

### 4. Input & Output: Talking to Your Program

Every computer application ever created—from Google Search to the camera app on your phone—runs on the exact same three-step pipeline:

```
[ Input ]  --->  [ Process ]  --->  [ Output ]
```

#### Outputting with `print()`
To display information on the terminal screen, we use Python's built-in `print()` function. But watch out! You need to pay close attention to whether you are printing a variable's value or literal text:

* `print(total)` displays the **dynamic value** stored inside the variable named `total` (like `200`).
* `print("total")` displays the **literal word** `"total"`.

When creating string text, single quotes (`'...'`) or double quotes (`"..."`) work equally well. You can also glue strings together using the addition operator (`+`), a process called **string concatenation**:

```python
name = "Maya"
greeting = "Hello " + name
print(greeting)  # Displays: Hello Maya
```

#### The #1 Beginner Trap: `input()`
To ask the user for information, we use the `input()` function (for example, `name = input("What is your name? ")`). 

> ⚠️ **The #1 Beginner Trap:** The `input()` function **ALWAYS returns a string**, even if the user types a number like `17`. To Python, user input comes in as raw text (`"17"`), not a usable integer.

#### Fixing the Trap: Type Conversion
Because raw user input is always a string, you can't perform math on it right away. If you try to divide `"17"` by `2`, Python will throw an error and crash! To fix this, you must convert the string into a numeric data type using **Type Conversion** functions:

* `int(x)`: Converts input `x` to an Integer (whole number).
* `float(x)`: Converts input `x` to a Float (decimal number).
* `str(x)`: Converts input `x` to a String (text).

---

### 5. Practical Math & Hands-On Project: The Age Calculator

Let's look at two handy arithmetic operators in Python that make whole-number division super easy:

* **Floor Division (`//`)**: Divides two numbers and rounds down to the nearest whole integer. This is perfect for calculating complete decade units (`age // 10`).
* **Modulo (`%`)**: Divides two numbers and returns *only the remainder*. This is perfect for calculating leftover years (`age % 10`).

#### The Age Calculator Script
Let's put all these concepts together to build a program that takes a user's age in years and breaks it down into decades and leftover years.

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

#### Walking Through the Pipeline Step-by-Step:
1. **Input**: `input("How old are you?\n")` pauses the program, asks the user for their age, and stores it as a string (e.g., `"17"`).
2. **Process**: 
   * `age = int(age)` converts `"17"` into the integer `17` so we can do math.
   * `decades = age // 10` evaluates `17 // 10` to get `1` full decade.
   * `years = age % 10` evaluates `17 % 10` to get `7` leftover years.
   * `decades = str(decades)` converts `1` back into `"1"`.
   * `years = str(years)` converts `7` back into `"7"`.
3. **Output**: `print(...)` glues the string pieces together (`"You are " + "1" + " decades..."`) and displays the final message on the screen.

> 💡 **Teacher Connection:** Why did we convert `decades` and `years` back into strings with `str()` before printing? Because Python cannot glue text strings and raw numbers together directly using `+`! If we skipped those `str()` conversion lines, Python would crash with a `TypeError`. Speaking of which... let's head to the Debugging Hall of Fame!

---

### 6. Debugging Hall of Fame: Avoiding Common Errors

Raise your hand if you've ever seen a bright red error message take over your terminal screen! 🖐️ 

Don't panic! In computer science, errors aren't failures—they are welcome badges of honor and helpful system feedback. Every master coder runs into them daily. Here are the top three beginner errors you'll see in Python and how to fix them in seconds.

#### 1. TypeError (Concatenating Text + Numbers)
This happens when you try to use `+` to glue a string and a numeric type together directly.

```python
# ❌ BROKEN CODE
age = 17
print("Age: " + age)  # Crashes! Python doesn't know whether to add or concatenate.
```

```python
# ✅ FIXED CODE
age = 17
print("Age: " + str(age))  # Success! Converts 17 to "17" first.
```

#### 2. Division Error / Math Mismatch
This happens when you attempt to perform arithmetic operations directly on raw input without converting it from a string to a number first.

```python
# ❌ BROKEN CODE
user_age = input("Enter your age: ")
half_age = user_age / 2  # Crashes! user_age is still a string like "17".
```

```python
# ✅ FIXED CODE
user_age = input("Enter your age: ")
numeric_age = int(user_age)  # Convert string to integer first!
half_age = numeric_age / 2   # Success!
```

#### 3. Quote Mismatch (SyntaxError)
This happens when you start a text string with a single quote `'` and accidentally end it with a double quote `"`, or vice versa.

```python
# ❌ BROKEN CODE
name = 'Alice"  # Crashes! Python is left hanging waiting for a matching quote.
```

```python
# ✅ FIXED CODE
name = "Alice"  # Success! Quotes match perfectly.
# OR
name = 'Alice'  # Also works!
```

---

### 7. Wrap-Up & Data Types Master Challenge

You've learned the fundamental mechanics of coding: storing data in variable boxes, recognizing primitive types (`int`, `float`, `str`), handling user I/O, and debugging type errors before they turn into $300 million spacecraft disasters. 

Ready to prove your skills? Work through the **Data Types Master Challenge** below!

> ### Data Types Master Challenge
> 
> **Q1**: What data type is created by `amount = 42`?  
> **Q2**: What exact text is output to the terminal screen by `print("5" + "5")`?  
> **Q3**: What data type does the `input()` function *always* return?  
> **Q4**: What is the output of the floor division expression `17 // 5`?  
> **Q5**: What is the output of the modulo expression `17 % 5`?  

---

#### Answer Key
1. `int` (Whole integer value without quotes or decimals)
2. `55` (Data type: string — `print()` displays the concatenated text characters `55` on the terminal without quotes)
3. `string` (Always raw text!)
4. `3` (5 goes into 17 three whole times)
5. `2` (The remainder left over after dividing 17 by 5)