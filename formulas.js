import { TokenTypes, lex } from './lexer.js';
import { compileLambda, timedLambdaReduce } from './eval-lambda.js';
import { Application } from './lambda.js';

const formulaNames = [];
const formulaExprs = [];
const formulaReductions = [];
let nHeadless = 0;

export function *formulas() {
    for (let i = formulaNames.length - 1; i >= 0; i--) yield {
        name: formulaNames[i],
        expr: formulaExprs[i],
        reductions: formulaReductions[i],
        index: i
    };
}

function appendSpace(div) {
    const whitespaceSpan = document.createElement('span');
    whitespaceSpan.textContent = ' ';
    div.appendChild(whitespaceSpan);
}

function addFormulaRow(name, expr, index, headless=false) {
    const formulaListElement = document.getElementById('formula-list');
    const formulaRow = document.createElement('tr');
    formulaRow.className = 'formula-row';
    formulaRow.dataset.index = index;

    const exprCell = document.createElement('td');
    const nameCell = document.createElement('td');
    
    if (expr instanceof Application)
        exprCell.innerHTML = `(${Lambda}*.* (<span style="color:aquamarine">${expr}</span>))`;
    else
        exprCell.innerHTML = `(${Lambda}*.* <span style="color:aquamarine">${expr}</span>)`;

    nameCell.innerHTML = `${Lambda}<b style="color:aquamarine">${name}</b>.`;

    formulaRow.appendChild(exprCell);
    formulaRow.appendChild(nameCell);

    formulaListElement.appendChild(formulaRow);

    if (headless) return;
    
    const buttonCell = document.createElement('td');

    const upButton = document.createElement('button');
    upButton.className = 'button';
    upButton.style.color = 'palegreen';
    upButton.textContent = '^';
    upButton.onclick = () => moveFormulaUp(parseInt(formulaRow.dataset.index));
    buttonCell.appendChild(upButton);

    appendSpace(buttonCell);

    const downButton = document.createElement('button');
    downButton.className = 'button';
    downButton.style.color = 'palegreen';
    downButton.textContent = 'v';
    downButton.onclick = () => moveFormulaDown(parseInt(formulaRow.dataset.index));
    buttonCell.appendChild(downButton);

    appendSpace(buttonCell);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'button';
    deleteButton.style.color = 'red';
    deleteButton.textContent = 'x';
    deleteButton.onclick = () => deleteFormula(parseInt(formulaRow.dataset.index));
    buttonCell.appendChild(deleteButton);

    appendSpace(buttonCell);

    formulaRow.appendChild(buttonCell);
}

function error(alertOnError, msg) {
    if (alertOnError) alert(msg);
    else throw new Error(msg);
}

window.addFormula = function(nameInput, exprInput, successCallback=undefined, alertOnError=true, headless=false) {
    const tokens = lex(nameInput);

    if (
        (tokens.length !== 1) ||
        (tokens[0].type !== TokenTypes.ID)
    ) return error(alertOnError, `Error: Enter a name with none of these special characters: "${Lambda}", "${TokenTypes.Dot.description}", "${TokenTypes.OpenParen.description}", "${TokenTypes.CloseParen.description}" or whitespace`);

    const name = tokens[0].value;

    if (formulaNames.includes(name))
        return error(alertOnError, `Error: Formula '${name}' already exists`);

    const result = compileLambda(exprInput);
    if (result.failed) return error(alertOnError, result.error);

    const expr = result.expr;
    const index = formulaNames.length;

    timedLambdaReduce(250, expr, reductions => {
        formulaNames.push(name);
        formulaExprs.push(expr);
        formulaReductions.push(reductions);
        addFormulaRow(name, expr, index, headless);
        if (headless) nHeadless++;
        if (successCallback) successCallback();
    }, false);
}

function moveFormulaUp(index) {
    if (index == /* 0 */ nHeadless) return;
    
    const [formulaName] = formulaNames.splice(index, 1);
    formulaNames.splice(index - 1, 0, formulaName);
    const [formulaExpr] = formulaExprs.splice(index, 1);
    formulaExprs.splice(index - 1, 0, formulaExpr);

    formulaReductions.splice(index, 1);
    timedLambdaReduce(250, formulaExpr, reductions => {
        formulaReductions.splice(index - 1, 0, reductions);

        const formulaRow = document.getElementById('formula-list').children[index];
        const previous = formulaRow.previousElementSibling;
        formulaRow.remove();
        previous.insertAdjacentElement('beforebegin', formulaRow);
    
        formulaRow.dataset.index = index - 1;
        previous.dataset.index = index;
    }, false, index - 1);
}

function moveFormulaDown(index) {
    if (index == formulaNames.length - 1) return;

    const [[formulaName], [formulaExpr]] = [formulaNames.splice(index, 1), formulaExprs.splice(index, 1)];
    formulaNames.splice(index + 1, 0, formulaName); formulaExprs.splice(index + 1, 0, formulaExpr);

    formulaReductions.splice(index, 1);
    timedLambdaReduce(250, formulaExpr, reductions => {
        formulaReductions.splice(index + 1, 0, reductions);
    
        const formulaRow = document.getElementById('formula-list').children[index];
        const next = formulaRow.nextElementSibling;
        formulaRow.remove();
        next.insertAdjacentElement('afterend', formulaRow);
    
        formulaRow.dataset.index = index + 1;
        next.dataset.index = index;
    }, false, index + 1);
}

function deleteFormula(index) {
    if (!confirm(`Are you sure you want to delete formula '${formulaNames[index]}'?`)) return;
    
    const formulaList = document.getElementById('formula-list');

    for (let i = index; i < formulaList.childElementCount; i++) {
        const child = formulaList.children[i];
        const childIndex = parseInt(child.dataset.index);
        child.dataset.index = childIndex - 1;
    }

    const formulaRow = formulaList.children[index];
    formulaRow.remove();

    formulaNames.splice(index, 1);
    formulaExprs.splice(index, 1);
    formulaReductions.splice(index, 1);
}
