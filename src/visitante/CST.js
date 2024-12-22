
// Auto-generated
import Nodo from './Nodo.js';

export class Producciones extends Nodo {

    constructor(id, expr, alias) {
        super();
        this.id = id;
		this.expr = expr;
		this.alias = alias;
    }

    accept(visitante){
        return visitante.visitProducciones(this);
    }
}
    
export class Opciones extends Nodo {

    constructor(exprs) {
        super();
        this.exprs = exprs;
    }

    accept(visitante){
        return visitante.visitOpciones(this);
    }
}
    
export class Union extends Nodo {

    constructor(exprs) {
        super();
        this.exprs = exprs;
    }

    accept(visitante){
        return visitante.visitUnion(this);
    }
}
    
export class Expresion extends Nodo {

    constructor(expr, label, qty) {
        super();
        this.expr = expr;
		this.label = label;
		this.qty = qty;
    }

    accept(visitante){
        return visitante.visitExpresion(this);
    }
}
    
export class String extends Nodo {

    constructor(val, isCase) {
        super();
        this.val = val;
		this.isCase = isCase;
    }

    accept(visitante){
        return visitante.visitString(this);
    }
}
    
export class Clase extends Nodo {

    constructor(chars, isCase) {
        super();
        this.chars = chars;
		this.isCase = isCase;
    }

    accept(visitante){
        return visitante.visitClase(this);
    }
}
    
export class Rango extends Nodo {

    constructor(bottom, top) {
        super();
        this.bottom = bottom;
		this.top = top;
    }

    accept(visitante){
        return visitante.visitRango(this);
    }
}
    