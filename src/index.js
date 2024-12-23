import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/+esm';
import { parse } from './parser/gramatica.js';
import Lexer from './visitante/Lexer.js';
import { ErrorReglas } from './parser/error.js';
import { Clase, Rango, String } from './visitante/CST.js';

export let ids = [];
export let usos = [];
export let errores = [];
export let tokens=[];


function generarModuloFortran(lista) {
    const lines = [];

    lines.push("module parser");
    lines.push("    implicit none");
    lines.push("contains");
    lines.push("");
    lines.push("    subroutine parse(input)");
    lines.push("        character(len=:), intent(inout), allocatable :: input");
    lines.push("        do while (len(input) > 0)");
    lines.push("            call nextsym(input)");
    lines.push("        end do");
    lines.push("    end subroutine parse");
    lines.push("");
    lines.push("    subroutine nextsym(input)");
    lines.push("        character(len=:), intent(inout), allocatable :: input");
    lines.push("        character(len=:), allocatable :: lexval");
    lines.push("        integer :: i");
    lines.push("        logical :: is_int, is_str, is_space");
    lines.push("        lexval = ''");
    lines.push("        i = 1");
    lines.push("        is_int = .false.");
    lines.push("        is_str = .false.");
    lines.push("        is_space = .false.");

    lista.forEach(obj => {
        if (obj instanceof RangosValor) {
            lines.push(`        ! Rango: ${obj.bottom}-${obj.top}`);
            let bottomValue = obj.bottom;
            let topValue = obj.top;

            bottomValue = '${bottomValue}';
            topValue = '${topValue}';
            lines.push(`        if (iachar(input(i:i)) >= iachar(${bottomValue}) .and. iachar(input(i:i)) <= iachar(${topValue})) then`);
            lines.push("            lexval = lexval // input(i:i)");

            if (obj.qty === '*') {
                lines.push("            ! Repetición: cero o más veces");
                lines.push(`            do while (iachar(input(i:i)) >= iachar(${bottomValue}) .and. iachar(input(i:i)) <= iachar(${topValue}))`);
                lines.push("                lexval = lexval // input(i:i)");
                lines.push("                i = i + 1");
                lines.push("            end do");
            } else if (obj.qty === '+') {
                lines.push("            ! Repetición: una o más veces");
                lines.push(`            do while (iachar(input(i:i)) >= iachar(${bottomValue}) .and. iachar(input(i:i)) <= iachar(${topValue}))`);
                lines.push("                lexval = lexval // input(i:i)");
                lines.push("                i = i + 1");
                lines.push("            end do");
            } else {
                lines.push("            ! Repetición: exactamente una vez");
            }
            lines.push("        end if");
        } else if (obj instanceof Cadena || obj instanceof StringCadena) {
            lines.push(`        ! Cadena: '${obj.cadena}'`);
            if (obj.caseMode === "i") {
                lines.push("        ! Comparación insensible a mayúsculas/minúsculas");
                lines.push(`        if (upper(input(i:i+${obj.cadena.length - 1})) == upper('${obj.cadena}')) then`);
            } else {
                lines.push("        ! Comparación sensible a mayúsculas/minúsculas");
                lines.push(`        if (input(i:i+${obj.cadena.length - 1}) == '${obj.cadena}') then`);
            }
            lines.push(`            lexval = lexval // input(i:i+${obj.cadena.length - 1})`);

            if (obj.qty === '*') {
                lines.push("            ! Repetición: cero o más veces");
                lines.push(`            do while (input(i:i+${obj.cadena.length - 1}) == '${obj.cadena}')`);
                lines.push(`                lexval = lexval // input(i:i+${obj.cadena.length - 1})`);
                lines.push(`                i = i + ${obj.cadena.length}`);
                lines.push("            end do");
            } else if (obj.qty === '+') {
                lines.push("            ! Repetición: una o más veces");
                lines.push(`            do while (input(i:i+${obj.cadena.length - 1}) == '${obj.cadena}')`);
                lines.push(`                lexval = lexval // input(i:i+${obj.cadena.length - 1})`);
                lines.push(`                i = i + ${obj.cadena.length}`);
                lines.push("            end do");
            } else {
                lines.push("            ! Repetición: exactamente una vez");
                lines.push(`            i = i + ${obj.cadena.length}`);
            }
            lines.push("        end if");
        }
    });

    lines.push("        ! Manejo del resto de la entrada");
    lines.push("        input = input(i:)");

    lines.push("    end subroutine nextsym");
    lines.push("end module parser");

    return lines.join("\n");
}







class RangosValor {
    constructor(bottom, top, qty, isCase) {
        this.bottom = bottom;
        this.top = top;
        this.qty = qty;
        this.isCase = isCase;
    }
}

class Cadena {
    constructor(cadena, qty, isCase) {
        this.cadena = cadena;
        this.qty = qty;
        this.isCase = isCase;
    }
}

class StringCadena {
    constructor(cadena, qty, isCase) {
        this.cadena = cadena;
        this.qty = qty;
        this.isCase = isCase;
    }
}


const editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'java',
    theme: 'tema',
    automaticLayout: true,
});


const salida = monaco.editor.create(document.getElementById('salida'), {
    value: '',
    language: 'java',
    readOnly: true,
    automaticLayout: true,
});

let decorations = [];

function transformarExpresiones(expresiones) {
    let resultado = [];

    expresiones.forEach(exp => {
        const { qty, expr } = exp; 
        if(expr instanceof Clase){
            const { isCase, chars } = expr; 

            chars.forEach(item => {
                if (item instanceof Rango) {
                 
                    resultado.push(new RangosValor(item.bottom, item.top, qty, isCase));
                } else if (typeof item === 'string') {
                    
                    resultado.push(new Cadena(item, qty, isCase));
                }
            });
        }else if(expr instanceof String){
            const { isCase, val } = expr; 
            resultado.push(new StringCadena(val,qty,isCase))
        }
    });

    return resultado;
}



const analizar = () => {
    const entrada = editor.getValue();
    ids.length = 0;
    usos.length = 0;
    errores.length = 0;
    try {
        const cst = parse(entrada);

        if (errores.length > 0) {
            salida.setValue(Error: ${errores[0].message});
            return;
        } else {
            salida.setValue('Análisis Exitoso');
        }


        decorations = editor.deltaDecorations(decorations, []);
        console.log(tokens)
        let nuevotokens=transformarExpresiones(tokens)
        console.log(nuevotokens)
        let codigo=generarModuloFortran(nuevotokens)
        console.log(codigo)
        /*const tokenizer = new Lexer();
        const fileContents = tokenizer.generateTokenizer(cst);*/

        const blob = new Blob([codigo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const button = document.getElementById('BotonDescarga');
        button.href = url;
    } catch (e) {
        if (e.location === undefined) {
            salida.setValue(Error: ${e.message});
        } else {
            // Mostrar mensaje de error en el editor de salida
            salida.setValue(
                Error: ${e.message}\nEn línea ${e.location.start.line} columna ${e.location.start.column}
            );

            // Resaltar el error en el editor de entrada
            decorations = editor.deltaDecorations(decorations, [
                {
                    range: new monaco.Range(
                        e.location.start.line,
                        e.location.start.column,
                        e.location.start.line,
                        e.location.start.column + 1
                    ),
                    options: {
                        inlineClassName: 'errorHighlight', // Clase CSS personalizada para cambiar color de letra
                    },
                },
                {
                    range: new monaco.Range(
                        e.location.start.line,
                        e.location.start.column,
                        e.location.start.line,
                        e.location.start.column
                    ),
                    options: {
                        glyphMarginClassName: 'warningGlyph', // Clase CSS para mostrar un warning en el margen
                    },
                },
            ]);
        }
    }
};

// Escuchar cambios en el contenido del editor
editor.onDidChangeModelContent(() => {
    analizar();
});

// CSS personalizado para resaltar el error y agregar un warning
const style = document.createElement('style');
style.innerHTML = `
    .errorHighlight {
        color: red !important;
        font-weight: bold;
    }
    .warningGlyph {
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="orange" d="M8 1l7 14H1L8 1z"/></svg>') no-repeat center center;
        background-size: contain;
    }
`;
document.head.appendChild(style);
{{
    
    // let identificadores = []

    // import { identificadores } from '../index.js'

    import { ids, usos, tokens} from '../index.js'
    import { ErrorReglas } from './error.js';
    import { errores } from '../index.js'

    import * as n from '../visitante/CST.js';
}}

gramatica
  = _ prods:producciones+ _ {
    let duplicados = ids.filter((item, index) => ids.indexOf(item) !== index);
    if (duplicados.length > 0) {
        errores.push(new ErrorReglas("Regla duplicada: " + duplicados[0]));
    }

    // Validar que todos los usos están en ids
    let noEncontrados = usos.filter(item => !ids.includes(item));
    if (noEncontrados.length > 0) {
        errores.push(new ErrorReglas("Regla no encontrada: " + noEncontrados[0]));
    }
    return prods;
  }

producciones
  = _ id:identificador _ alias:(literales)? _ "=" _ expr:opciones (_";")? {
    ids.push(id);
    return new n.Producciones(id, expr, alias);
  }

opciones
  = expr:union rest:(_ "/" _ @union)* {
    return new n.Opciones([expr, ...rest]);
  }

union
  = expr:expresion rest:(_ @expresion !(_ literales? _ "=") )* {
    return new n.Union([expr, ...rest]);
  }

expresion
  = label:$(etiqueta/varios)? _ expr:expresiones _ qty:$([?+*]/conteo)? {
    tokens.push(new n.Expresion(expr, label, qty))
    return new n.Expresion(expr, label, qty);
  }

etiqueta = ("@")? _ id:identificador _ ":" (varios)?

varios = ("!"/"$"/"@"/"&")

expresiones
  = id:identificador {
    usos.push(id)
  }
  / val:$literales isCase:"i"? {
    return new n.String(val.replace(/['"]/g, ''), isCase);
  }
  / "(" _ opciones _ ")"
  / chars:clase isCase:"i"? {
    return new n.Clase(chars, isCase)
  }
  / "."
  / "!."

// conteo = "|" parteconteo _ (_ delimitador )? _ "|"

conteo = "|" _ (numero / id:identificador) _ "|"
        / "|" _ (numero / id:identificador)? _ ".." _ (numero / id2:identificador)? _ "|"
        / "|" _ (numero / id:identificador)? _ "," _ opciones _ "|"
        / "|" _ (numero / id:identificador)? _ ".." _ (numero / id2:identificador)? _ "," _ opciones _ "|"

// parteconteo = identificador
//             / [0-9]? _ ".." _ [0-9]?
// 			/ [0-9]

// delimitador =  "," _ expresion

// Regla principal que analiza corchetes con contenido
clase
  = "[" @contenidoClase+ "]"

contenidoClase
  = bottom:$[^\[\]] "-" top:$[^\[\]] {
    return new n.Rango(bottom, top);
  }
  / $[^\[\]]

literales
  = '"' @stringDobleComilla* '"'
  / "'" @stringSimpleComilla* "'"

stringDobleComilla = !('"' / "\\" / finLinea) .
                    / "\\" escape
                    / continuacionLinea

stringSimpleComilla = !("'" / "\\" / finLinea) .
                    / "\\" escape
                    / continuacionLinea

continuacionLinea = "\\" secuenciaFinLinea

finLinea = [\n\r\u2028\u2029]

escape = "'"
        / '"'
        / "\\"
        / "b"
        / "f"
        / "n"
        / "r"
        / "t"
        / "v"
        / "u"

secuenciaFinLinea = "\r\n" / "\n" / "\r" / "\u2028" / "\u2029"

// literales = 
//     "\"" [^"]* "\""
//     / "'" [^']* "'"
    

numero = [0-9]+

identificador = [_a-z]i[_a-z0-9]i* { return text() }


_ = (Comentarios /[ \t\n\r])*


Comentarios = 
    "//" [^\n]* 
    / "/" (!"/" .)* "*/"

