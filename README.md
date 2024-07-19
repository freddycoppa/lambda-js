# Lambda Calculus Interpreter
This is a simple web app that evaluates expressions in Lambda Calculus, the smallest universal programming language introduced by Alonzo Church in the 1930s. It encompasses the following functionalities:

- Evaluating λ-expressions
  - The 'λ' symbol can be inserted using the backslash '\\' key
  - Evaluations yield *β-* and *η-reductions* of the entered expression, as well as any *α-equivalent* terms present in the Formulæ list
- Formulas that can be used in λ-expressions
  - The list of formulas can be found in the *Formulæ* section
  - An assortment of relevant combinatory birds are already preloaded into the list
  - Custom formulas can be added
- Conversion of λ-expressions to *SKI-expressions*, only containing the combinators *S*, *K* & *I*

The app can be found at [freddycoppa.github.io/lambda-js](https://freddycoppa.github.io/lambda-js/)
