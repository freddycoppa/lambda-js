function decideBracket(bracket, string) {
    return bracket ? `(${string})` : string;
}

function nextQualifiedName(name) {
    if (
        (name.length === 1) &&
        (name.toLowerCase() !== name.toUpperCase()) &&
        (name.charAt(0) !== 'Z') &&
        (name.charAt(0) !== 'z')
    ) return String.fromCharCode(name.charCodeAt(0) + 1);
    const numbers = name.match(/\d+$/);
    if (numbers) return name.substring(0, name.length - numbers[0].length) + (parseInt(numbers[0]) + 1).toString();
    else return name + '0';
}

class Term {
    constructor(repr) {
        this.repr = repr;
    }

    toString() {
        return this.repr;
    }

    equals(that) {
        throw new Error(`equals() not implemented in ${this.constructor.name}`);
    }

    isFree(name) {
        throw new Error(`isFree() not implemented in ${this.constructor.name}`);
    }

    alphaEquiv(that) {
        throw new Error(`alphaEquiv() not implemented in ${this.constructor.name}`);
    }

    etaReduce() {
        throw new Error(`etaReduce() not implemented in ${this.constructor.name}`);
    }

    replace(name, expr) {
        throw new Error(`replace() not implemented in ${this.constructor.name}`);
    }

    reduce(lazy=false) {
        throw new Error(`reduce() not implemented in ${this.constructor.name}`);
    }

    ski() {
        throw new Error(`ski() not implemented in ${this.constructor.name}`);
    }
}

export const Bottom = new class BottomType extends Term {
    constructor() {
        super('\u22a5');
    }
};

export class Variable extends Term {
    constructor(name) {
        super(name);
        this.name = name;
    }

    equals(that) {
        return (this === that) || (
            (that instanceof Variable) &&
            (this.name === that.name)
        );
    }

    isFree(name) {
        return this.name === name;
    }

    alphaEquiv(that) {
        return this.equals(that);
    }

    etaReduce() {
        return this;
    }

    replace(name, expr) {
        return this.name === name ? expr : this;
    }

    reduce(lazy=false) {
        return this;
    }

    ski() {
        return this;
    }
}

export class Abstraction extends Term {
    constructor(bound, term, repr=undefined) {
        if (repr === undefined) super(`${/* Lambda */'\u03bb'}${bound}.${term}`);
        else super(repr);
        this.bound = bound;
        this.term = term;
    }

    equals(that) {
        return (this === that) || (
            (that instanceof Abstraction) &&
            (this.bound === that.bound) &&
            (this.term.equals(that.term))
        );
    }

    isFree(name) {
        return (this.bound !== name) && this.term.isFree(name);
    }

    alpha(x0=undefined) {
        if (!x0) for (
            x0 = nextQualifiedName(this.bound);
            this.term.isFree(x0);
            x0 = nextQualifiedName(x0)
        );
        else if (this.term.isFree(x0)) return this;
        return new Abstraction(x0, this.term.replace(this.bound, new Variable(x0)));
    }

    mutualAlpha(that) {
        let x0; for (
            x0 = 'a';
            this.isFree(x0) || that.isFree(x0);
            x0 = nextQualifiedName(x0)
        );
        return [this.alpha(x0), that.alpha(x0)];
    }

    alphaEquiv(that) {
        if (!(that instanceof Abstraction)) return false;
        const [{ term: t0 }, { term: t1 }] = this.mutualAlpha(that);
        return t0.alphaEquiv(t1);
    }

    etaReduce(eager=true) {
        if (
            (this.term instanceof Application) &&
            (this.term.arg instanceof Variable) &&
            (this.term.arg.name === this.bound) &&
            !this.term.func.isFree(this.bound)
        ) return eager ? this.term.func.etaReduce() : this.term.func;
        else if (eager) return new Abstraction(this.bound, this.term.etaReduce()).etaReduce(false);
        else return this;
    }

    replace(name, expr) {
        let a = this;
        if (a.bound === name) return a;
        while (expr.isFree(a.bound)) a = a.alpha();
        if (a.bound === name) return a;
        return new Abstraction(a.bound, a.term.replace(name, expr));
    }

    reduce(lazy=false) {
        if (lazy) return this;
        return new Abstraction(this.bound, this.term.reduce(false));
    }

    ski() {
        const eta = this.etaReduce(false);
        if (!this.equals(eta)) return eta.ski();

        if (!this.term.isFree(this.bound))
            return new Application(new Variable('K'), this.term.ski());

        if (
            this.term instanceof Variable &&
            this.term.name === this.bound
        ) return new Variable('I');

        if (this.term.isFree(this.bound)) {
            if (this.term instanceof Abstraction)
                return new Abstraction(this.bound, this.term.ski()).ski();
            if (this.term instanceof Application)
                return new Application(
                    new Application(
                        new Variable('S'),
                        new Abstraction(this.bound, this.term.func).ski()
                    ),
                    new Abstraction(this.bound, this.term.arg).ski()
                );
        }
    }
}

export class Application extends Term {
    constructor(func, arg, repr=undefined) {
        if (repr === undefined) super(`${
            decideBracket(func instanceof Abstraction, func)
        } ${
            decideBracket(!(arg instanceof Variable), arg)
        }`);
        else super(repr);
        this.func = func;
        this.arg = arg;
    }

    equals(that) {
        return (this === that) || (
            (that instanceof Application) &&
            this.func.equals(that.func) &&
            this.arg.equals(that.arg)
        );
    }

    isFree(name) {
        return this.func.isFree(name) || this.arg.isFree(name);
    }

    alphaEquiv(that) {
        return (that instanceof Application) &&
            this.func.alphaEquiv(that.func) &&
            this.arg.alphaEquiv(that.arg);
    }

    etaReduce() {
        return new Application(this.func.etaReduce(), this.arg.etaReduce());
    }

    replace(name, expr) {
        return new Application(this.func.replace(name, expr), this.arg.replace(name, expr));
    }

    reduce(lazy=false) {
        const func = this.func.reduce(true);
        if (func instanceof Abstraction)
            return func.term.replace(func.bound, this.arg).reduce(lazy);
        return new Application(func, this.arg.reduce(false));
    }

    ski() {
        return new Application(this.func.ski(), this.arg.ski());
    }
}

export function deserialize(obj) { // should this be in lambda-worker.js instead?
    if (obj.name !== undefined) return new Variable(obj.name);
    if (obj.bound !== undefined && obj.term !== undefined)
        return new Abstraction(obj.bound, deserialize(obj.term), obj.repr);
    if (obj.func !== undefined && obj.arg !== undefined)
        return new Application(deserialize(obj.func), deserialize(obj.arg), obj.repr);
}
