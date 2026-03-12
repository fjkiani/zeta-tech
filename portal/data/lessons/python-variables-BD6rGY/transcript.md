# Python Variables

## Lecture Transcript

Um,   who's in who's into who's logged into   Python anywhere? Give me like a plus one   or   tell me it's not working if it's not   working.   Good. Good. Thanks, Angel.   Okay. So,   um   let's do let's kind of like do some   let's do some warm-up exercises. So, I   I'll I'll start I'll start us off. Um I   I'll do I'll do a few just to kind of   um just to give us like an idea of what   we have been doing so far.

Um so so far   like we have just kind of worked on   variables. We did some of it yesterday   where we were able to print things out   um on our console like I think we did   something like this where we hardcoded   it   um and then we pressed enter we got a   hello and then after that I think we   worked on creating variables where now   instead of directly passing in hello we   can say uh this variable Okay.

Uh the   value of this equals hello. And remember   the reason why I'm passing or writing   these quotations is because we are using   a string. So we have a that's a string.   Uh and then we have B where we can say   uh it's a number. So   now we have hello and we have a number   that's 50. My question is if we want to   return   um   hello 50 like how would we do that? So   return   hello 50   what's the   based on this like how do we return   this?   So

print good. Okay we got print. What   else? We starting with print. What are   we doing now with print?   What do we got? Print. Okay. Um,   well, print. And remember whenever we   reprint we always put in these little uh   well these brackets. Now within the   brackets now we can do something called   concatenation.

So this term concatenation is basically   where we combine where we take   where we take variable A and then we   combine it with variable B. Um, so   anyone have an idea like how how can I   how can I return hello 50   what what am I passing in into the print   statement?   Good. There you go. Exactly. So   what am I just passing in a plus b or am   I passing in quotation or   um   what with the quotation? Okay, let's   start with the quotation.

Why didn't that work?   Anyone knows? Look here. Remember when   we passed in with the quotations, we   passed in hello, we got back hello,   right?   Um but now when we're passing in with   the quotations again writing um a plus b   we're basically telling the programming   language that hey   return back a plus b as a string   because the quotations we're assigning   it a value of a string and therefore   it's just returning what we give it.

So,   what if we try it without the   quotations?   Now, what do we get? Oh, we don't get   anything. Something's off. Um,   okay. So,   can only concatenate a string, not   integer to string. So, what's going on?   Let's try again.   Um, it's telling us we can only   concatenate string, not integer.   So, anyone have an idea like why what's   going on? What why is it failing?   Here's a type error.

It's telling us   this. Look this up. Uh, you have a chat   bar, right? You have you should have   this chatbot open.   Um,   you should have this chatbot open. And   then I want you to ask that   we have this   uh we have this   and   we want to print   we want to print   hello 50   but getting   this error. Why?   Ask this. Ask this to your chatbot.

See   like what kind of answers it it gives   you, what you come back with.   Okay, I I'll do with you. So, let's dig   into it. So, the question is right, we   have we have two var we have one   variable   uh a is equal to hello   Good. Explain this like why why will   this print versus the other one didn't   print? Um   what did we do here? Tell me about   these.

What what are these curly bra uh   brackets?   Um   why did we add the f? Tell me more. Like   break this down for me. Like   tell us more.   Um   so if you have the chatbot ask this   question you know you can ask these   these are the concepts of prompt   engineering is is how can you learn by   asking the right thing. Um so remember   hello is a variable um and 50 is an   integer. So we say b is equal to uh 50.

And then the question is how   can we   combine the word is called concatenate.   on cat to Nate   and return.   Uh, Angel, what's what's the answer?   Like, how how did you get that answer?   Explain it. Break it out.   Okay. So   let's let's look at this. So so to   concatenate a string and a an integer in   Python you need to convert the integer   into a string. Okay.

So   basically we   we can't just pass in the integer. We   can't just combine it with hello   apparently like we need to convert the   integer uh into a string. But   let's see if there's an easier way. Um,   you know, like what's the easier way?   I just want to print it.   Okay. I think this is what you wrote,   right, Angel? You wrote print uh F.

And basically what we're doing is we're   taking in the value of one and we're   taking in the value of the other. So   let's let's break this down even more   like hey what does this mean? What do   the curly   brackets mean?   Right? It's it's giving us these.   So   let's look at it. The the curly brackets   or placeholders   used in string formatting.

they indicate   where to insert values within a string.   An in string when you use the f string   uh so you got f uh you pass in a   variable a pass in integer b the   expression inside the curly brackets are   evaluated at runtime and their values   are inserted into the string. So in the   format method when you use format   um so curly curly format string the   curly bra bracket placeholders   correspond to the arguments passed to   the format function.

This first sets   curly brackets is replaced. Okay it's a   it's a quite a it's quite a tedious long   answer. So as you see   we essentially if we can pass in   so so there's two ways right like we   have the for an string and then we have   the format method so in this the curly   bracket picked up Alice is and then it   picked up um 30 years old.

How did it   pick that up is because we then passed   in this format method. We we wrote down   dot format and we passed in the var we   passed in the two uh variables which was   the name and one was the age and this   gave us back Alice is 30 years old. So I   want you to try this. Um this dot format   is one way on how we can do it.

Um the   string is another approach on how we can   do it. So   let's try it again. I I want you to   print this out this time. Print this   out.   Um, so a No, actually I want you to   print this out. My name is uh your name   and I   live   X miles away. Okay, go for it.   Same thing we have   we have um we have two things again   right like we have variable A which is   uh your name which could be let's say um   Fahad   and then we have the number which would

be uh let's say miles and I'll say five   right now   let's try. We have two approaches,   right? We can use the F uh the F   statement, the F string or we can use   the format method. Anyone wants to tell   me what's the format method? Like what   does this mean? How does this work? Is   this a function? Is this an operator or   um like what is this?   You can ask you can ask your chatbot say   like hey explain like what explain the   format method.

Is it a function?   Is it an operator?   And it tells us   so   the the Python library it comes with   several built-in functions. Oh, it's   going to keep going. So let's pause. So   the Python library comes in with tons of   built-in functions and   this allows us to format strings. It   allows us to uh manipulate data into   like a easier format you can say.

So   let's try it. Everyone got an output?   Everyone got your name? So all all we're   doing is is we're just passing in like   remember two curly brackets format.name.   Um   so if you go back anyone wants to help   me like how how are we going to use this   print?   Um how how am I doing this? So my name   is   Right.   What else?   Uh maybe a curly bracket.

My name is Fahad   and I and I live   X miles   away. What are we going to do after?   What's the   What's the format method? So it's   format, right? format.   And remember when we did it above?   >> Yeah. Like remember this, right? What   did what did we do? We did we passed in   the two curly bracelets.   We wrote in format and then we passed in   string value   um what the value was and then we passed   in the integer value.

Um, and then we   closed it with two brackets.   So, we'll say,   okay, does this look correct? Like, will   will this work?   Why why is it breaking   two brackets here? What am I missing?   What's uh   where should the other one be? Anyone   Anyone can take a guess   here. Right. So we have the print

statement.   We're passing in curly bracket one,   curly bracket two. We're passing in the   u the format method. We have one here   and then we have two here   and   Can anyone see it? Like what's still   bolt this right? Like this shouldn't be   here.   Let's try it again. Still broken.   Okay, good. Good. We got one extra out.

What else? Why is it still failing? Do   we have another one here? Still failing.   Perhaps you forgot the comma.   Let's try let's try like very simple.   Let's try it with just the curly   brackets.   So we have curly bracket A   and then we have curly bracket 2   and then we are   just passing in format.

What was it?   format dot.   Yeah. Format, right?   Do I wrap this up into   what's my syntax? Is this correct? Does   this look okay? Does it not look okay?   Doesn't look okay. Why? Why doesn't it   look okay? What's What's going on? Well,   one is that when we pass in the curly   brackets, we're going to wrap them   around the quotations, right? Like   anytime we print something,   um, we're going to wrap this.

So,   let's do that first.   Okay. What else?   We wrapped it. We passed in format. And   then we pass in both of these values. So   we'll say format. Oh, where did it go?   And then we pass in what is it? Um, A   and B. Right? Cuz think about it. What   did we do here? We passed in   string value which we defined as hello   and we passed in integer value which we   defined as 50. Right? So looks good.

What are we missing? One parenthesy.   Let's try this. There we go. Okay, good.   Let's try it again. One more time. So,   we got FAD 50. But how can we get FAD   lives 50?   Is it 50? It should be five, not 50,   right? Like, why are we getting 50?   Um, let's try it again. Like, Bahad   lives 5 miles away.   Anyone   got it? Or   how does your Python screen look?   Can we say   can we say we pass in this piece of

string uh we combine it with this   curly bracket and then we format it. Do   you think this would work?   I want everyone to print this out. My   friend Bahad lives   5 miles away.   Print this out. Send it with the right   syntax   and then u share it in the chat.   Okay,   we're gonna jump back into this. we   we're just kind of playing around with a   little bit of uh variable strings, but   uh the these are basically the crucial   parts.

Um,   so let's let's kind of dive into this a   little bit   strings the these variables are actually   very important because one mismatch   apparently in uh I think some time ago   this this small mismatch caused $300   million in damages in NASA. Um how did   it happen? In 1999,   um the orbiter was expecting float   newtons as a metric unit, but instead it   received an imperial unit   which used float pounds force and   essentially this uh derail in the data   type uh caused a big big mismatch   and um essentially costed them $300   million of um of damage.   So

this is one of the homeworks I want you   to like make think about how you can   make a calculator like you know we we   want you to   um   build a calculator.   H how how is this calculator working?   Like anyone have an idea like how   we we covered variables. We haven't   covered inputs. We covered variables. We   covered math.

Uh we we covered like   somewhat of conversions. Um and we   covered a little bit of output. But   let's keep going into it. So,   so what is it doing? So, someone tell me   like the the first prompt tells us how   old are you? Then what happens after? I   type in a number and then it gives me   back an output. It says you are 20   decades and 2 years old.

Okay, this is   how it works. We have something called   the input where you the the Python asks   you a question. It could ask you   anything like you do you guys know when   you go to an ATM it ask you for like a   pin number? Uh it asks you if you're   looking to withdraw, deposit. All of   those are just simple inputs that are   taking some sort of value in from you   and then they're processing it on the   back end with a CPU and then they're   outputting you know like here's your   balance uh here's what you need to do   and this basically represents 90% of all   software from algorithms to rockets uh   to banks   and how this all works is again we We we   we tried to mess with this earlier by

using this term called variable where we   assigned the variable a value and the   value was either a string where we   passed in um like you know your name or   we passed in a number and that's all it   is that we have a variable we assign it   a value and that's called a label   and um and the contents are called a you   and and this is how I want you to try   this again.

So give yourself give your   function like a variable a length and a   width and then I want you to multiply it   and then tell me what you get back. Try   this.   So we have length, we have width and we   want to essentially get back length   times width.   Anyone wants to go tell me um help me   guide me through h how do how do we get

lent times wet   here's the Sh.   Anyone got it?   Well, let's try it together. So, we can   say length equals 20.   Uh, width equals   60. Um, what are we doing with this? The   len times width, right? So, what's the   first what's the first part? What do we   write? Print maybe. Okay. Print. What

else? len times width.   Uh what are we doing? Just passing in   len times width or how do I complete   this?   Does it look good? Do you think it's   work?   Sorry, my   Okay, so the asterct we basically just   multiplied it. Um, this just gives us

length times width. Pretty basic. But I   think one of the things I want you to   take away from this is earlier we were   trying to work with a string and we were   combining it with um   with a number. But you notice that we   couldn't just simply print them out. We   had to use the method. Uh we had to   convert.

But now right now we're working   purely with just numbers. So you know if   we have um if we want to multiply we   simply just pass in the multiplication.   If we want to add we could just add. Uh   if we want to subtract we can just   subtract. Um every everyone got this   like try try this again. Try try this   for all uh subtraction,   division,   addition,   multiplication.

Okay, let's try this for all of them.   Um,   anyone ready? Anyone wants to do it?   Let's try. Let's try for   let's try for multiplication. So what we   just did multiplication let's try it for   the division. So we have a is equal to   50. We have b is equal to 25.   Uh and basically we want to divide a by   b.

So what would it be? Uh tell me like   if we want to divide a by b what am I   doing?   Would it be a over b?   No, it's not.   Why? Why are we getting back just 2.0   versus   Why aren't we getting back? Well, 2.0 is   it, right? Like   50 divided by 25, we get two. Um, let's   try   this is division. We tried   multiplication. Let's try addition. A is   equal to 50. Uh, B is equal to 100.

and 50.   Um, if I want to combine a plus b, what   is it? This is easy. Come on.   A plus b, right?   200. Um, good, good, good.   So, so this is basically like the how we   can do math um using these variables.   Um, and   this is how essentially we assign a   value. We're sticking with the number.   Uh, and then we assign what we want as   the return.

Um, and then we can pass in   either the multiplication sign, the   division or subtraction or whatever   we're trying to achieve.   Um, think of it like this. code is a   conversation between you and the   computer learn its language. When you   assign a variable, you are telling the   computer remember this for later. So   this is important.

Um when we assign a   value to a variable, we're just telling   the computer return this for later. And   there's three different types. We we we   dove into this earlier. uh we haven't   dove into float but we dove it into the   in integer which is basically a whole   number integer and intact. So we passed   in age is equal to 17 um and then we   passed in like you know we we we were   able to print that out.

Uh we did it   with the string too. We said name   remember these little quotations that go   around. Um and then we also we haven't   dove into this but float is basically a   decimal. So 9.99   um   and Python and psychic type inter   interference   amount. We have amount that's $10. We   have amount that's $10.50 which would be   a float.

Uh and then we have the amount   that could be 10 which is just a string.   You don't always have to tell Python the   data type. It guesses based on the value   that you assign. Okay.   So,   print this out. I'll try this. Print   out.   Print out 42 as an integer.   Uh 42 as a string.   and 42.0   as a float.   This is one of the takeaways. Anything   that is inside quotes, even a number, is   treated as text. So you see this we

assigned 42 as a into a variable but we   passed in um we passed we passed in the   strings and therefore Python is not   going to treat it as a as an integer.   It's going to treat it as a as a string.   Um who got this out? Who who is able to   print this out so far? Uh we have 42 as   an integer, 42 as a string, 42.

0 O as a   float. You guys got it.   How would I define 42 as an integer?   Uh float is just printing the value.   Correct. Uh float is essentially just   utilizing decimal uh decimal values.   You guys got You guys printed all these   three out.   Yes. No. Give me a plus one if you got   it.   Okay. Oh, we couldn't do the first one.

Okay. Okay.   What what's the hard part about the   first one? Let's let's let's dig into   it. Um   remember integer is integer is basically   a number. So we can just say number is   equal to 42.   Um   versus number text is equal to 42. But   it's a text. So   then we can say number float is equal to   4.0.   Right? So if we want to print,   if we want to combine   number float plus number, do you think   this will work?

It should work, right? Because why why   would this work? Because they're both   integers.   But would remember what we tried to do   earlier. Would this work if we say print   number text   plus number? Will this work?   It won't work, right? Because we have   one that's a number and then we have one   that's a that's a string.

So it's it's   not able to combine both of these   together. As you saw, we had to use uh   kind of like a different   uh different method that converts the   >> the uh period end by the way.   >> Oh, periods ended. Okay. Okay. Okay.
