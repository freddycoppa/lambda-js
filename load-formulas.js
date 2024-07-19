fetch(new URL('formula-library.json', window.location.origin))
.then(res => res.json())
.then(async data => {
    for (const [ name, exprString ] of data)
        await new Promise(
            resolve => addFormula(name, exprString, resolve, false, true)
        );
});

/* 
await newFormula('@', 'λf.λg.λx.f (g x)');
await newFormula('<>', 'λf.λa.λb.f b a');
await newFormula('++', '<> @');
await newFormula('w', 'λf.f f');
await newFormula('Y', 'λf.w (@ f w)');
 */
