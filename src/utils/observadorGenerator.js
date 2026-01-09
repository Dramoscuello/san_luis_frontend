
/**
 * Generador de Observador del Estudiante para Vue.js
 */

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    PageOrientation,
    BorderStyle,
    WidthType,
    VerticalAlign,
    ImageRun,
    Header
} from 'docx'
import { saveAs } from 'file-saver'
import logoIzquierdaUrl from '@/assets/img.png'
import logoDerechaUrl from '@/assets/Escudo_de_Colombia.svg.png'

// ============================================
// CONFIGURACIÓN DE ESTILOS
// ============================================
const FUENTE = 'Arial'
const BORDE = { style: BorderStyle.SINGLE, size: 1, color: '000000' }
const BORDES = { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE }

// Anchos de columna (en DXA - 1440 = 1 pulgada)
// Anchos de columna (en DXA - 1440 = 1 pulgada)
const ANCHOS = {
    PERIODO: 993,
    FORTALEZAS: 3500,
    DIFICULTADES: 3500,
    COMPROMISOS: 3500,
    FIRMA: 2967,
    TOTAL: 14460
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function urlToBuffer(url) {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
}

/**
 * Crea una celda de tabla con texto simple
 */
function crearCelda(texto, opciones = {}) {
    const {
        ancho = 1000,
        colspan = 1,
        bold = false,
        fontSize = 18, // 9pt
        alineacion = AlignmentType.LEFT,
        verticalAlign = VerticalAlign.CENTER
    } = opciones

    return new TableCell({
        borders: BORDES,
        width: { size: ancho, type: WidthType.DXA },
        columnSpan: colspan,
        verticalAlign: verticalAlign,
        margins: { top: 50, bottom: 50, left: 80, right: 80 },
        children: [
            new Paragraph({
                alignment: alineacion,
                children: [
                    new TextRun({
                        text: texto || '',
                        font: FUENTE,
                        size: fontSize,
                        bold: bold
                    })
                ]
            })
        ]
    })
}

/**
 * Crea una celda con múltiples líneas de texto
 */
function crearCeldaMultilinea(contenido, opciones = {}) {
    const {
        ancho = 1000,
        colspan = 1,
        fontSize = 18,
        alineacion = AlignmentType.LEFT,
        verticalAlign = VerticalAlign.TOP
    } = opciones

    // Convertir a array si es string
    const lineas = Array.isArray(contenido)
        ? contenido
        : (contenido || '').split('\n')

    const parrafos = lineas.map(texto =>
        new Paragraph({
            alignment: alineacion,
            spacing: { after: 50 },
            children: [
                new TextRun({
                    text: texto || '',
                    font: FUENTE,
                    size: fontSize
                })
            ]
        })
    )

    // Si está vacío, agregar un párrafo vacío para mantener altura
    if (parrafos.length === 0 || (parrafos.length === 1 && !lineas[0])) {
        for (let i = 0; i < 4; i++) {
            // preserve whitespace to force height? or just empty
            parrafos.push(new Paragraph({ children: [] }))
        }
    }

    return new TableCell({
        borders: BORDES,
        width: { size: ancho, type: WidthType.DXA },
        columnSpan: colspan,
        verticalAlign: verticalAlign,
        margins: { top: 50, bottom: 50, left: 80, right: 80 },
        children: parrafos
    })
}

/**
 * Crea el encabezado institucional con Logos
 */
async function crearEncabezadoInstitucional() {
    const bufferIzq = await urlToBuffer(logoIzquierdaUrl);
    const bufferDer = await urlToBuffer(logoDerechaUrl);

    const textoInstitucional = [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'REPÚBLICA DE COLOMBIA', font: FUENTE, size: 18 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'INSTITUCIÓN EDUCATIVA SAN LUIS', font: FUENTE, size: 18, bold: true })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'RESOLUCION Nº 001217 de SEPTIEMBRE DE 2002', font: FUENTE, size: 14 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'RESOLUCION Nº 000495 de NOVIEMBRE 23 DE 2007', font: FUENTE, size: 14 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'SAN JOSE DE URE – CÓRDOBA *CORREGIMIENTO VIERA ABAJO', font: FUENTE, size: 14 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'COD. ICFES 139238 – 139246 NIT 812005633 – 0 * NUCLEO 0079', font: FUENTE, size: 14 })]
        })
    ];

    // Regresamos una tabla sin bordes para alinear logos y texto
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideH: { style: BorderStyle.NONE },
            insideV: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    // Logo Izquierda
                    new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: bufferIzq,
                                        transformation: { width: 80, height: 80 }
                                    })
                                ]
                            })
                        ]
                    }),
                    // Texto Centro
                    new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: textoInstitucional
                    }),
                    // Logo Derecha
                    new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        horizontalAlign: AlignmentType.RIGHT, // Align content to right
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new ImageRun({
                                        data: bufferDer,
                                        transformation: { width: 80, height: 80 }
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

function crearTituloObservador() {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 200 },
        children: [
            new TextRun({
                text: 'OBSERVADOR DEL ESTUDIANTE',
                font: FUENTE,
                size: 32,
                bold: true
            })
        ]
    });
}


/**
 * Crea la tabla con los datos del estudiante
 */
function crearTablaEstudiante(estudiante) {
    const e = estudiante

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            // Fila 1: Nombre, Grado, Año
            new TableRow({
                children: [
                    crearCelda(`NOMBRE DEL ESTUDIANTE: ${e.nombre || ''}`, {
                        ancho: 10632,
                        colspan: 6,
                        fontSize: 20
                    }),
                    crearCelda(`GRADO: ${e.grado || ''}`, {
                        ancho: 1985,
                        colspan: 2,
                        fontSize: 20
                    }),
                    crearCelda(`AÑO: ${e.anio || ''}`, {
                        ancho: 1843,
                        colspan: 2,
                        fontSize: 20
                    })
                ]
            }),
            // Fila 2: Edad, Fecha nacimiento, Lugar, Celular
            new TableRow({
                children: [
                    crearCelda(
                        `Edad: ${e.edad || ''}    Fecha y Lugar de Nacimiento: Día: ${e.diaNacimiento || ''}  Mes: ${e.mesNacimiento || ''}  Año: ${e.anioNacimiento || ''}  Lugar: ${e.lugarNacimiento || ''}    Cel: ${e.celular || ''}`,
                        { ancho: ANCHOS.TOTAL, colspan: 10, fontSize: 16 }
                    )
                ]
            }),
            // Fila 3: Documento, RH, EPS, Estado
            new TableRow({
                children: [
                    crearCelda(
                        `${e.tipoDocumento || 'T.I.'}: ${e.numeroDocumento || ''}    RH: ${e.rh || ''}    EPS: ${e.eps || ''}    ${e.estadoMatricula === 'Nuevo' ? 'Nuevo: X    Antiguo:    Repitente:' :
                            e.estadoMatricula === 'Repitente' ? 'Nuevo:    Antiguo:    Repitente: X' :
                                'Nuevo:    Antiguo: X    Repitente:'
                        }`,
                        { ancho: ANCHOS.TOTAL, colspan: 10, fontSize: 16 }
                    )
                ]
            }),
            // Fila 4: Dirección
            new TableRow({
                children: [
                    crearCelda(`DIRECCIÓN DE VIVIENDA: ${e.direccion || ''}`, {
                        ancho: ANCHOS.TOTAL,
                        colspan: 10,
                        fontSize: 16
                    })
                ]
            }),
            // Fila 5: Padres y Acudiente
            new TableRow({
                children: [
                    crearCelda(
                        `NOMBRE DEL PADRE: ${e.nombrePadre || ''}    NOMBRE DE LA MADRE: ${e.nombreMadre || ''}    ACUDIENTE: ${e.acudiente || ''}    CEL: ${e.celularAcudiente || ''}`,
                        { ancho: ANCHOS.TOTAL, colspan: 10, fontSize: 16 }
                    )
                ]
            })
        ]
    })
}

/**
 * Crea la tabla de observaciones por período
 */
function crearTablaObservaciones(observaciones) {
    const filas = []

    // Encabezados
    filas.push(new TableRow({
        children: [
            crearCelda('PERÍODO', {
                ancho: ANCHOS.PERIODO,
                bold: true,
                fontSize: 18,
                alineacion: AlignmentType.CENTER
            }),
            crearCelda('FORTALEZAS', {
                ancho: ANCHOS.FORTALEZAS,
                bold: true,
                fontSize: 18,
                alineacion: AlignmentType.CENTER
            }),
            crearCelda('DIFICULTADES', {
                ancho: ANCHOS.DIFICULTADES,
                bold: true,
                fontSize: 18,
                alineacion: AlignmentType.CENTER
            }),
            crearCelda('COMPROMISOS', {
                ancho: ANCHOS.COMPROMISOS,
                bold: true,
                fontSize: 18,
                alineacion: AlignmentType.CENTER
            }),
            crearCelda('FIRMA ACUDIENTE', {
                ancho: ANCHOS.FIRMA,
                bold: true,
                fontSize: 16,
                alineacion: AlignmentType.CENTER
            })
        ]
    }))

    // Filas de cada período
    const periodos = ['I', 'II', 'III', 'IV']

    periodos.forEach(periodoRomano => {
        // Asumimos que 'observaciones' viene mapeado por KEY romana 'I', 'II', etc.
        const obs = observaciones[periodoRomano] || {}

        filas.push(new TableRow({
            children: [
                crearCelda(periodoRomano, {
                    ancho: ANCHOS.PERIODO,
                    bold: true,
                    fontSize: 36,
                    alineacion: AlignmentType.CENTER
                }),
                crearCeldaMultilinea(obs.fortalezas || '', {
                    ancho: ANCHOS.FORTALEZAS,
                    fontSize: 18
                }),
                crearCeldaMultilinea(obs.dificultades || '', {
                    ancho: ANCHOS.DIFICULTADES,
                    fontSize: 18
                }),
                crearCeldaMultilinea(obs.compromisos || '', {
                    ancho: ANCHOS.COMPROMISOS,
                    fontSize: 18
                }),
                crearCelda('', { // Firma vacía
                    ancho: ANCHOS.FIRMA,
                    fontSize: 18,
                    alineacion: AlignmentType.CENTER
                })
            ]
        }))
    })

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: filas
    })
}

/**
 * Crea la firma del docente
 */
function crearFirmaDocente() {
    return [
        new Paragraph({ spacing: { before: 200 } }),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
                new TextRun({
                    text: 'FIRMA DEL DOCENTE: _____________________________________________ ',
                    font: FUENTE,
                    size: 22,
                    bold: true
                })
            ]
        })
    ]
}

// ============================================
// FUNCIÓN PRINCIPAL - EXPORTAR
// ============================================

export async function generarObservador(estudiante, observaciones, nombreArchivo = null) {
    // Cargar imagenes para encabezado
    const encabezadoTabla = await crearEncabezadoInstitucional();

    // Crear el documento
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        width: 15840,  // 11 pulgadas (landscape)
                        height: 12240, // 8.5 pulgadas
                        orientation: PageOrientation.LANDSCAPE
                    },
                    margin: {
                        top: 720, // 0.5 in
                        right: 720,
                        bottom: 720,
                        left: 720
                    }
                }
            },
            children: [
                encabezadoTabla,
                crearTituloObservador(),
                crearTablaEstudiante(estudiante),
                new Paragraph({ spacing: { before: 100, after: 100 } }),
                crearTablaObservaciones(observaciones),
                ...crearFirmaDocente()
            ]
        }]
    })

    // Generar el blob y descargar
    const blob = await Packer.toBlob(doc)

    const archivo = nombreArchivo ||
        `Observador_${(estudiante.nombre || 'Estudiante').replace(/\s+/g, '_')}_${estudiante.anio || new Date().getFullYear()}.docx`

    saveAs(blob, archivo)
}

export default { generarObservador }
