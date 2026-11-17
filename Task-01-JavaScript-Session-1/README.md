# Task 01 – JavaScript Session 1: Functions

The assignment is in [assignment.txt](assignment.txt). It asks for six applications, each showing every function listed in it.

## What is in this folder

| Folder | Contents |
|---|---|
| `projects/` | The six applications in plain HTML, CSS and JavaScript (no frameworks) |
| `documentation/` | Word documentation for all six applications, with screenshots |
| `presentations/` | `JavaScript-Functions-Projects.pptx` (the projects) and `JavaScript-Basics.pptx` (variables, operators, datatypes, loops, control statements) |
| `tests/` | `run-tests.py`, which runs 88 automated checks against the applications in headless Chrome |

## The six applications

1. Banking – login, balance enquiry, deposit, withdraw, fund transfer, mini statement
2. Online Food Ordering – menu, cart, bill, coupons, payment, order tracking, cancellation
3. Online Movie Ticket Booking – movie, theatre, show time, seat selection, booking, payment
4. E-Commerce Shopping – registration, login, search, cart, discount, summary, payment, tracking
5. Hospital Management – patient registration, doctor availability, appointments, prescriptions, bills
6. Railway Ticket Booking – train search, availability, fare, booking, cancellation, PNR status

Every function follows the same steps: take the input, check it, update the data, show the result, return an answer. All names use full words with no short forms.

## How to run

Open `projects/index.html` in a browser. Or start a local server from this folder:

```bash
python -m http.server 8765 --directory projects
```

Then open http://localhost:8765.

## How to run the tests

Needs Python and Google Chrome installed at the default location.

```bash
python tests/run-tests.py
```
