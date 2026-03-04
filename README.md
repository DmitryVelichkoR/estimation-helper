# EstimationHelper

EstimationHelper is a tool for **estimating marketing websites based on reusable UI components**.

Instead of estimating by page count, the system analyzes a website, detects unique UI components, groups them into component families, and allows an estimator to assign **development and QA hours** per component.

The goal is to make **pre-sale estimation more structured and predictable**.

---

# What the project does

1. Analyzes a website using a headless browser
2. Detects UI components (hero, cards, navigation, etc.)
3. Groups them into reusable component families
4. Shows reuse counts
5. Allows assigning **Dev / QA hours**
6. Produces a structured estimate

Example component families:

- Navigation
- Hero
- Card
- Accordion
- Modal
- Footer
- Content Block

---

# How to run

Clone the repository

Bash:
git clone https://github.com/DmitryVelichkoR/estimation-helper.git
cd estimation-helper


Start the UI

cd studio-app
npm install
npm run dev

Open in browser

http://localhost:3000


Example workflow

Enter a website URL

Run analysis

Review detected components

Assign Dev / QA hours

Get total estimate


Example output

Website analyzed

https://stripe.com

Analysis summary

Pages analyzed: 36
Unique components: 34
Component families: 6

Detected component families

Navigation
Hero
Card
Accordion
Modal
Footer
Content Block

Example estimation

Card family
Dev: 6h
QA: 3h

Hero
Dev: 4h
QA: 2h

Navigation
Dev: 5h
QA: 2h

Total estimate

Dev: 30h
QA: 15h

Results are stored in /artifacts/<estimateId>/
