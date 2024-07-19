export const TokenTypes = Object.freeze({
    OpenParen: Symbol('('),
    CloseParen: Symbol(')'),
    ID: Symbol('ID'),
    Lambda: Symbol(/* Lambda */'\u03bb'),
    Dot: Symbol('.'),
    /* Eq: Symbol('='),
    Del: Symbol('~') */
});

// TODO: Add token positions

export function lex(string) {
    string = string.replace(/\s/g, ' ');

    const tokens = [];

    let i = 0;
    let tempID = "";

    function pushIDandFlush() {
        if (!tempID) return;
        tokens.push({type: TokenTypes.ID, value: tempID});
        tempID = "";
    }

    while (string && (i < string.length)) {
        const c = string.charAt(i);

        switch (c) {
            case TokenTypes.OpenParen.description:
                pushIDandFlush();
                tokens.push({type: TokenTypes.OpenParen});
                break;
            case TokenTypes.CloseParen.description:
                pushIDandFlush();
                tokens.push({type: TokenTypes.CloseParen});
                break;
            case TokenTypes.Lambda.description:
                pushIDandFlush();
                tokens.push({type: TokenTypes.Lambda});
                break;
            case TokenTypes.Dot.description:
                pushIDandFlush();
                tokens.push({type: TokenTypes.Dot});
                break;
            /* case TokenTypes.Eq.description:
                pushIDandFlush();
                tokens.push({type: TokenTypes.Eq});
                break;
            case TokenTypes.Del.description:
                pushIDandFlush();
                tokens.push({type: TokenTypes.Del});
                break; */
            case ' ':
                pushIDandFlush();
                break;
            default:
                tempID += c;
        }

        i++;
    }

    pushIDandFlush();

    return tokens;
}
