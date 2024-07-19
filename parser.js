import { TokenTypes } from "./lexer.js";
import { Variable, Abstraction, Application } from "./lambda.js";

function fail(error) {
    return {failed: true, error: "Error: " + error};
}

function pass(expr, index) {
    return {failed: false, expr, index};
}

function term(tokens, i) {
    if (!tokens || (i >= tokens.length)) return fail("End Of Input");
    
    if (
        (i < tokens.length) &&
        (tokens[i].type === TokenTypes.ID)
    ) return pass(new Variable(tokens[i].value), i + 1);

    if (
        (i + 2 < tokens.length) &&
        (tokens[i].type === TokenTypes.Lambda) &&
        (tokens[i + 1].type === TokenTypes.ID) &&
        (tokens[i + 2].type === TokenTypes.Dot)
    ) {
        const result = expr(tokens, i + 3);
        if (result.failed) return result;
        return pass(new Abstraction(tokens[i + 1].value, result.expr), result.index);
    }

    if (
        (i < tokens.length) &&
        (tokens[i].type === TokenTypes.OpenParen)
    ) {
        const result = expr(tokens, i + 1);
        if (result.failed) return result;

        if (
            (result.index < tokens.length) &&
            (tokens[result.index].type === TokenTypes.CloseParen)
        ) return pass(result.expr, result.index + 1);

        return fail("Expected ')'!");
    }

    return fail(`Unexpected '${tokens[i].type.description}'`);
}

function apply(expr, tokens, i) {
    if (
        !tokens ||
        (i >= tokens.length) ||
        (tokens[i].type === TokenTypes.CloseParen)
    ) return pass(expr, i);

    const result = term(tokens, i);
    if (result.failed) return result;
    return apply(new Application(expr, result.expr), tokens, result.index);
}

function expr(tokens, i) {
    const result = term(tokens, i);
    if (result.failed) return result;
    return apply(result.expr, tokens, result.index);
}

export function parse(tokens, i=0) {
    const result = expr(tokens, i);
    if (result.index < tokens.length) { // checking for unused tokens
        return fail(`Error: Unexpected '${tokens[result.index].type.description}'`);
    }
    return result;
}
