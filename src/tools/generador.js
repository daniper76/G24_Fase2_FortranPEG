// Generar clases para AST
// Este archivo genera las clases necesarias para implementar el patrón visitante con Typescript

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodes from './Nodo.js';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajustar las rutas de destino
const classesDestination = path.join(__dirname, '../visitante/CST.js');
const visitorDestination = path.join(__dirname, '../visitante/Visitante.js');

// Generar código para Visitante
let codeString = `
// Auto-generated


export default class Visitante{

`;
for (const node of Object.keys(nodes)) {
    codeString += `\t visit${node}(nodo){}\n`;
}
codeString += `}`;

writeFileSync(visitorDestination, codeString);
console.log('Generated visitor Interface');

// Generar código para nodos
codeString = `
// Auto-generated
import Nodo from './Nodo.js';
`;
for (const [name, args] of Object.entries(nodes)) {
    codeString += `
export class ${name} extends Nodo {

    constructor(${args.join(', ')}) {
        super();
        ${args.map((arg) => `this.${arg} = ${arg};`).join('\n\t\t')}
    }

    accept(visitante){
        return visitante.visit${name}(this);
    }
}
    `;
    console.log(`Generating ${name} node`);
}

writeFileSync(classesDestination, codeString);
console.log('Done!');
