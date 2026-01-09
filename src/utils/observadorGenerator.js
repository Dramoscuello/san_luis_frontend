/**
 * Generador de Observador del Estudiante en PDF
 * Usa pdfmake para generar documentos PDF con tablas
 */

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import logoIzquierdaUrl from '@/assets/img.png'
import logoDerechaUrl from '@/assets/Escudo_de_Colombia.svg.png'

// Registrar fuentes
pdfMake.vfs = pdfFonts.vfs

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Convierte una URL de imagen a base64
 */
async function imageToBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = reject
        img.src = url
    })
}

/**
 * Crea el encabezado institucional con logos
 */
function crearEncabezadoInstitucional(logoIzq, logoDer) {
    return {
        table: {
            widths: [60, '*', 60],
            body: [
                [
                    {
                        image: logoIzq,
                        width: 50,
                        alignment: 'center'
                    },
                    {
                        stack: [
                            { text: 'REPÚBLICA DE COLOMBIA', alignment: 'center', fontSize: 9 },
                            { text: 'INSTITUCIÓN EDUCATIVA SAN LUIS', alignment: 'center', fontSize: 10, bold: true },
                            { text: 'RESOLUCION Nº 001217 de SEPTIEMBRE DE 2002', alignment: 'center', fontSize: 7 },
                            { text: 'RESOLUCION Nº 000495 de NOVIEMBRE 23 DE 2007', alignment: 'center', fontSize: 7 },
                            { text: 'SAN JOSE DE URE – CÓRDOBA *CORREGIMIENTO VIERA ABAJO', alignment: 'center', fontSize: 7 },
                            { text: 'COD. ICFES 139238 – 139246 NIT 812005633 – 0 * NUCLEO 0079', alignment: 'center', fontSize: 7 }
                        ]
                    },
                    {
                        image: logoDer,
                        width: 50,
                        alignment: 'center'
                    }
                ]
            ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 10]
    }
}

/**
 * Crea el título del observador
 */
function crearTituloObservador() {
    return {
        text: 'OBSERVADOR DEL ESTUDIANTE',
        fontSize: 14,
        bold: true,
        alignment: 'center',
        margin: [0, 10, 0, 15]
    }
}

/**
 * Crea la tabla con los datos del estudiante
 */
function crearTablaEstudiante(estudiante) {
    const e = estudiante
    const cellStyle = { fontSize: 8, margin: [3, 4, 3, 4] }
    const labelStyle = { fontSize: 8, bold: true, margin: [3, 4, 3, 4] }

    return {
        table: {
            widths: ['auto', '*', 'auto', '*', 'auto', 50, 'auto', 80],
            body: [
                // Fila 1: Nombre del estudiante, Grado, Año
                [
                    { text: 'NOMBRE DEL ESTUDIANTE:', ...labelStyle },
                    { text: e.nombre || '', ...cellStyle, colSpan: 3 },
                    {},
                    {},
                    { text: 'GRADO:', ...labelStyle },
                    { text: e.grado || '', ...cellStyle },
                    { text: 'AÑO:', ...labelStyle },
                    { text: e.anio || '', ...cellStyle }
                ],
                // Fila 2: Edad, Fecha de nacimiento, Lugar de nacimiento
                [
                    { text: 'EDAD:', ...labelStyle },
                    { text: e.edad || '', ...cellStyle },
                    { text: 'FECHA NAC.:', ...labelStyle },
                    { text: e.fechaNacimiento || '', ...cellStyle },
                    { text: 'LUGAR NAC.:', ...labelStyle },
                    { text: e.lugarNacimiento || '', ...cellStyle, colSpan: 3 },
                    {},
                    {}
                ],
                // Fila 3: Tipo documento, N° documento, RH, EPS
                [
                    { text: 'TIPO DOC.:', ...labelStyle },
                    { text: e.tipoDocumento || 'T.I.', ...cellStyle },
                    { text: 'N° DOC.:', ...labelStyle },
                    { text: e.numeroDocumento || '', ...cellStyle },
                    { text: 'RH:', ...labelStyle },
                    { text: e.rh || '', ...cellStyle },
                    { text: 'EPS:', ...labelStyle },
                    { text: e.eps || '', ...cellStyle }
                ],
                // Fila 4: Nombre del padre, Ocupación, Celular
                [
                    { text: 'NOMBRE DEL PADRE:', ...labelStyle },
                    { text: e.nombrePadre || '', ...cellStyle, colSpan: 3 },
                    {},
                    {},
                    { text: 'OCUPACIÓN:', ...labelStyle },
                    { text: e.ocupacionPadre || '', ...cellStyle },
                    { text: 'CELULAR:', ...labelStyle },
                    { text: e.celularPadre || '', ...cellStyle }
                ],
                // Fila 5: Nombre de la madre, Ocupación, Celular
                [
                    { text: 'NOMBRE DE LA MADRE:', ...labelStyle },
                    { text: e.nombreMadre || '', ...cellStyle, colSpan: 3 },
                    {},
                    {},
                    { text: 'OCUPACIÓN:', ...labelStyle },
                    { text: e.ocupacionMadre || '', ...cellStyle },
                    { text: 'CELULAR:', ...labelStyle },
                    { text: e.celularMadre || '', ...cellStyle }
                ],
                // Fila 6: Nombre del acudiente, Celular
                [
                    { text: 'NOMBRE DEL ACUDIENTE:', ...labelStyle },
                    { text: e.acudiente || '', ...cellStyle, colSpan: 5 },
                    {},
                    {},
                    {},
                    {},
                    { text: 'CELULAR:', ...labelStyle },
                    { text: e.celularAcudiente || '', ...cellStyle }
                ]
            ]
        },
        margin: [0, 0, 0, 10]
    }
}

/**
 * Crea la tabla de observaciones por período
 */
function crearTablaObservaciones(observaciones) {
    const periodos = ['I', 'II', 'III', 'IV']

    // Encabezados
    const headerRow = [
        { text: 'PERÍODO', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [2, 5, 2, 5] },
        { text: 'FORTALEZAS', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [2, 5, 2, 5] },
        { text: 'DIFICULTADES', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [2, 5, 2, 5] },
        { text: 'COMPROMISOS', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [2, 5, 2, 5] },
        { text: 'FIRMA ACUDIENTE', bold: true, fontSize: 8, alignment: 'center', fillColor: '#f0f0f0', margin: [2, 5, 2, 5] }
    ]

    const body = [headerRow]

    // Filas de cada período
    periodos.forEach(periodoRomano => {
        const obs = observaciones[periodoRomano] || {}

        body.push([
            { text: periodoRomano, bold: true, fontSize: 16, alignment: 'center', margin: [2, 15, 2, 15] },
            { text: obs.fortalezas || '', fontSize: 8, margin: [3, 5, 3, 5] },
            { text: obs.dificultades || '', fontSize: 8, margin: [3, 5, 3, 5] },
            { text: obs.compromisos || '', fontSize: 8, margin: [3, 5, 3, 5] },
            { text: '', fontSize: 8, margin: [3, 20, 3, 20] } // Espacio para firma
        ])
    })

    return {
        table: {
            headerRows: 1,
            widths: [40, '*', '*', '*', 70],
            body: body
        },
        margin: [0, 0, 0, 15]
    }
}

/**
 * Crea la sección de firma del docente
 */
function crearFirmaDocente() {
    return {
        text: 'FIRMA DEL DOCENTE: _____________________________________________',
        fontSize: 10,
        bold: true,
        alignment: 'right',
        margin: [0, 20, 0, 0]
    }
}

// ============================================
// FUNCIÓN PRINCIPAL - EXPORTAR
// ============================================

export async function generarObservador(estudiante, observaciones, nombreArchivo = null) {
    // Cargar imágenes como base64
    const logoIzq = await imageToBase64(logoIzquierdaUrl)
    const logoDer = await imageToBase64(logoDerechaUrl)

    // Definición del documento
    const docDefinition = {
        pageSize: 'LETTER',
        pageOrientation: 'landscape',
        pageMargins: [40, 40, 40, 40],
        content: [
            crearEncabezadoInstitucional(logoIzq, logoDer),
            crearTituloObservador(),
            crearTablaEstudiante(estudiante),
            crearTablaObservaciones(observaciones),
            crearFirmaDocente()
        ],
        defaultStyle: {
            font: 'Roboto'
        }
    }

    // Generar nombre del archivo
    const archivo = nombreArchivo ||
        `Observador_${(estudiante.nombre || 'Estudiante').replace(/\s+/g, '_')}_${estudiante.anio || new Date().getFullYear()}.pdf`

    // Generar y descargar PDF
    pdfMake.createPdf(docDefinition).download(archivo)
}

export default { generarObservador }
