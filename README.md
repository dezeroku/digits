# digits!

A small web app based on a mobile game, that tests your ability to see patterns.

# How does it work?

At the start of the game you are given a board (basically a 2D array),
that's filled with digits from 1 to 9.
Your job is to match every two digits in a pair.
Matching the pair causes both the digits to disappear and your score to go up by the sum of the two
(TODO: add bonus points based on distance).

Digits can be paired if one of the below statements is true:

- digits are the same
- sum of the chosen digits is equal to 10

To make it a little harder there are also rules regarding positions of the digits themselves.
They have to line up either vertically, horizontally or diagonally and you can only match the two digits
if there are no digits left between them (either they are neighbours or the digits between them have already been
eliminated previously).

As a side bonus, the horizontal matching also works between multiple rows, as long as there are no digits between.
For example, in the below 2D array the digits 3 and 7 can be paired, because of this rule:
|3| |
| |7|
| | |

But in the below 2D array they can not be matched because of the digit 5 that's blocking the way:
|3| |
|5|7|
| | |
