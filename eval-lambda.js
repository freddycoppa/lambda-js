import { lex } from './lexer.js';
import { parse } from './parser.js';
import { formulas } from './formulas.js';
import { Bottom, deserialize } from './lambda.js';

export function compileLambda(input, failOnEmpty=true) {
    const tokens = lex(input);
    if (tokens.length === 0 && !failOnEmpty) return null;
    return parse(tokens);
}

window.evalLambda = function(input) {
    const result = compileLambda(input, false);
    if (result === null) return null;
    if (result.failed) {
        alert(result.error);
        return null;
    }
    let expr = result.expr;
    for (const formula of formulas())
        expr = expr.replace(formula.name, formula.expr);
    return [result.expr, expr.reduce()];
}

export function timedLambdaReduce(ms, expr, callback, findAlphaEquivalences=true, startBeforeIndex=Infinity) {
    for (const formula of formulas()) if (formula.index < startBeforeIndex)
        expr = expr.replace(formula.name, formula.expr);
    const lambdaWorker = new Worker('./lambda-worker.js', { type: 'module' });
    lambdaWorker.postMessage(expr);
    const timer = setTimeout(() => {
        lambdaWorker.terminate();
        callback({ betaReduced: Bottom });
    }, ms);
    lambdaWorker.onmessage = async e => {
        clearTimeout(timer);
        const betaReduced = deserialize(e.data);
        let etaReduced = betaReduced.etaReduce();
        if (betaReduced.equals(etaReduced)) etaReduced = undefined;
        let alphaEquivalences;
        if (findAlphaEquivalences) {
            alphaEquivalences = [];
            for (const formula of formulas()) {
                const {
                    betaReduced: fBetaReduced,
                    etaReduced: fEtaReduced
                } = formula.reductions;
                if (fBetaReduced === Bottom) continue;
                if (
                    betaReduced.alphaEquiv(fBetaReduced) ||
                    (fEtaReduced && betaReduced.alphaEquiv(fEtaReduced)) ||
                    (etaReduced && etaReduced.alphaEquiv(fBetaReduced)) ||
                    (etaReduced && fEtaReduced && etaReduced.alphaEquiv(fEtaReduced))
                ) alphaEquivalences.push(formula.name);
            }
        }
        callback({ betaReduced, etaReduced, alphaEquivalences });
    }
}

window.evalLambdaTimed = function(ms, input, callback) {
    const result = compileLambda(input, false);

    if (result === null) {
        callback(null);
        return;
    }

    if (result.failed) {
        alert(result.error);
        callback(null);
        return;
    }

    let expr = result.expr;
    
    timedLambdaReduce(ms, expr, reductions => callback({ expr, ...reductions }));
}

window.clearLambdaResult = function() {
    document.getElementById('lambda-result-expr-content').textContent = '';
    document.getElementById('lambda-result-ski-content').textContent = '';
    document.getElementById('lambda-result-beta-content').textContent = '';
    document.getElementById('lambda-result-eta-content').textContent = '';
    document.getElementById('lambda-result-alpha-content').textContent = '';
    document.getElementById('lambda-result-ski').style.display = 'none';
    document.getElementById('lambda-result-beta').style.display = 'none';
    document.getElementById('lambda-result-eta').style.display = 'none';
    document.getElementById('lambda-result-alpha').style.display = 'none';
    document.getElementById('lambda-result').style.display = 'none';
}

window.displayEvalLambda = function() {
    evalLambdaTimed(250, document.getElementById('lambda-input').value, result => {
        if (result === null) return;
        clearLambdaResult();
        const { expr, betaReduced, etaReduced, alphaEquivalences } = result;
        document.getElementById('lambda-result-expr-content').textContent = expr;
        document.getElementById('lambda-result-beta-content').textContent = betaReduced;
        document.getElementById('lambda-result-beta').style.display = 'table-row';
        if (etaReduced) {
            document.getElementById('lambda-result-eta-content').textContent = etaReduced;
            document.getElementById('lambda-result-eta').style.display = 'table-row';
        }
        if (alphaEquivalences && alphaEquivalences.length > 0) {
            document.getElementById('lambda-result-alpha-content').textContent = alphaEquivalences.toReversed().join(', ');
            document.getElementById('lambda-result-alpha').style.display = 'table-row';
        }
        document.getElementById('lambda-result').style.display = 'block';
    });
}

window.displaySKI = function(input) {
    const result = compileLambda(input, false);

    if (result === null) return;

    if (result.failed) return alert(result.error);

    let expr = result.expr;

    for (const formula of formulas())
        expr = expr.replace(formula.name, formula.expr);

    clearLambdaResult();
    document.getElementById('lambda-result-expr-content').textContent = result.expr;
    document.getElementById('lambda-result-ski-content').textContent = expr.ski();
    document.getElementById('lambda-result-ski').style.display = 'table-row';
    document.getElementById('lambda-result').style.display = 'block';
}
