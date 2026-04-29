import { MockConversionPlugin } from './plugin.interface.js';
export const conversionPlugins = [
    new MockConversionPlugin('Document Engine', 'documents', ['pdf-lib', 'pdf.js', 'mammoth', 'xlsx', 'pptxgenjs', 'libreoffice']),
    new MockConversionPlugin('OCR Engine', 'documents', ['tesseract.js', 'google-cloud-vision', 'aws-textract'], true),
    new MockConversionPlugin('Image Engine', 'images', ['sharp', 'jimp', 'resvg-js', 'imagemagick'], false, true),
    new MockConversionPlugin('Media Engine', 'media', ['ffmpeg', 'fluent-ffmpeg', 'whisper'], false, true),
    new MockConversionPlugin('FreeCAD Bridge', 'freecad', ['freecadcmd', 'python-occ', 'cadquery'], false, true),
    new MockConversionPlugin('Fusion 360 Bridge', 'fusion360', ['fusion360-rest', 'fusion360-headless-script'], true, true),
    new MockConversionPlugin('SolidWorks Bridge', 'solidworks', ['solidworks-com-dotnet'], true, true),
    new MockConversionPlugin('Cura Slicer Bridge', 'cura', ['CuraEngine slice'], false, true),
    new MockConversionPlugin('PrusaSlicer Bridge', 'prusaslicer', ['prusaslicer --slice'], false, true),
    new MockConversionPlugin('KiCad Bridge', 'kicad', ['pcbnew', 'eeschema', 'gerber-parser', 'excellon-parser'], false, true),
    new MockConversionPlugin('Blender Bridge', 'blender', ['blender --background --python', 'gltf-pipeline'], false, true),
    new MockConversionPlugin('OpenSCAD Bridge', 'openscad', ['openscad --export-format'], false, true)
];
const documents = [
    capability('pdf-word', 'PDF', 'Word', 'documentos', ['pdf.js', 'mammoth', 'libreoffice'], 'Document Engine'),
    capability('word-pdf', 'Word', 'PDF', 'documentos', ['mammoth', 'libreoffice', 'pdf-lib'], 'Document Engine'),
    capability('pdf-excel', 'PDF', 'Excel', 'documentos', ['pdf.js', 'xlsx', 'tabula-like-parser'], 'Document Engine'),
    capability('excel-pdf', 'Excel', 'PDF', 'documentos', ['xlsx', 'playwright', 'pdf-lib'], 'Document Engine'),
    capability('word-excel', 'Word', 'Excel', 'documentos', ['mammoth', 'xlsx'], 'Document Engine'),
    capability('excel-word', 'Excel', 'Word', 'documentos', ['xlsx', 'docx'], 'Document Engine'),
    capability('pdf-powerpoint', 'PDF', 'PowerPoint', 'documentos', ['pdf.js', 'pptxgenjs'], 'Document Engine'),
    capability('powerpoint-pdf', 'PowerPoint', 'PDF', 'documentos', ['pptxgenjs', 'libreoffice'], 'Document Engine'),
    capability('markdown-pdf', 'Markdown', 'PDF', 'documentos', ['marked', 'playwright', 'md-to-pdf'], 'Document Engine'),
    capability('html-pdf', 'HTML', 'PDF', 'documentos', ['playwright', 'puppeteer'], 'Document Engine')
];
const pdfAdvanced = [
    capability('juntar-pdf', 'PDFs', 'PDF unido', 'pdf_avancado', ['pdf-lib'], 'Document Engine', true),
    capability('dividir-pdf', 'PDF', 'PDFs separados', 'pdf_avancado', ['pdf-lib'], 'Document Engine', true),
    capability('ocr-pdf', 'PDF', 'Texto OCR', 'pdf_avancado', ['tesseract.js', 'aws-textract', 'google-cloud-vision'], 'OCR Engine', true, true),
    capability('extrair-tabelas-pdf', 'PDF', 'Tabelas', 'pdf_avancado', ['pdf.js', 'aws-textract', 'xlsx'], 'OCR Engine', true, true),
    capability('comprimir-pdf', 'PDF', 'PDF comprimido', 'pdf_avancado', ['ghostscript', 'pdf-lib'], 'Document Engine', true, false, true)
];
const spreadsheets = [
    capability('csv-excel', 'CSV', 'Excel', 'planilhas', ['xlsx'], 'Document Engine'),
    capability('excel-csv', 'Excel', 'CSV', 'planilhas', ['xlsx'], 'Document Engine'),
    capability('json-excel', 'JSON', 'Excel', 'planilhas', ['xlsx'], 'Document Engine'),
    capability('excel-json', 'Excel', 'JSON', 'planilhas', ['xlsx'], 'Document Engine'),
    capability('planilha-dashboard', 'Planilha', 'Dashboard', 'planilhas', ['xlsx', 'echarts-ready-json'], 'Document Engine')
];
const images = [
    capability('jpg-png', 'JPG', 'PNG', 'imagens', ['sharp', 'jimp'], 'Image Engine'),
    capability('png-jpg', 'PNG', 'JPG', 'imagens', ['sharp', 'jimp'], 'Image Engine'),
    capability('webp-png', 'WEBP', 'PNG', 'imagens', ['sharp'], 'Image Engine'),
    capability('svg-png', 'SVG', 'PNG', 'imagens', ['resvg-js', 'sharp'], 'Image Engine'),
    capability('heic-jpg', 'HEIC', 'JPG', 'imagens', ['heic-convert', 'sharp'], 'Image Engine', false, false, true),
    capability('imagem-ocr', 'Imagem', 'Texto OCR', 'imagens', ['tesseract.js', 'google-cloud-vision'], 'OCR Engine', true)
];
const cad = [
    capability('step-stl', 'STEP', 'STL', 'cad_engenharia', ['opencascade.js', 'freecadcmd', 'cadquery'], 'FreeCAD Bridge', true, false, true),
    capability('iges-stl', 'IGES', 'STL', 'cad_engenharia', ['python-occ', 'freecadcmd'], 'FreeCAD Bridge', true, false, true),
    capability('stl-gcode', 'STL', 'G-code', 'cad_engenharia', ['CuraEngine', 'PrusaSlicer'], 'Cura Slicer Bridge', true, false, true),
    capability('stl-obj', 'STL', 'OBJ', 'cad_engenharia', ['three.js', 'stl-to-obj', 'blender'], 'Blender Bridge', true, false, true),
    capability('obj-gltf', 'OBJ', 'GLTF', 'cad_engenharia', ['three.js', 'gltf-pipeline', 'blender'], 'Blender Bridge', true, false, true),
    capability('dwg-pdf', 'DWG', 'PDF', 'cad_engenharia', ['Autodesk Platform Services', 'ODA converter'], 'Fusion 360 Bridge', true, true, true),
    capability('dxf-dwg', 'DXF', 'DWG', 'cad_engenharia', ['Autodesk Platform Services', 'FreeCAD'], 'Fusion 360 Bridge', true, true, true),
    capability('dwg-excel', 'DWG', 'Excel', 'cad_engenharia', ['dxf-parser', 'xlsx', 'Autodesk Platform Services'], 'Fusion 360 Bridge', true, true, true),
    capability('step-relatorio', 'STEP', 'Relatório', 'cad_engenharia', ['freecadcmd', 'Gemma', 'xlsx'], 'FreeCAD Bridge', true, false, true),
    capability('stl-visualizacao', 'STL', 'Visualização', 'cad_engenharia', ['three.js', 'babylonjs'], 'Blender Bridge', true)
];
const electronics = [
    capability('gerber-pdf', 'Gerber', 'PDF', 'eletronica_gerber', ['gerber-parser', 'pcb-stackup', 'KiCad'], 'KiCad Bridge', true, false, true),
    capability('gerber-relatorio', 'Gerber', 'Relatório', 'eletronica_gerber', ['gerber-parser', 'pcb-stackup', 'Gemma'], 'KiCad Bridge', true, false, true),
    capability('gerber-dxf', 'Gerber', 'DXF', 'eletronica_gerber', ['KiCad pcbnew', 'gerber-parser'], 'KiCad Bridge', true, false, true),
    capability('bom-excel', 'BOM', 'Excel', 'eletronica_gerber', ['csv-parser', 'xlsx'], 'KiCad Bridge'),
    capability('excellon-relatorio', 'Excellon', 'Relatório', 'eletronica_gerber', ['excellon-parser', 'Gemma'], 'KiCad Bridge', true, false, true)
];
const media = [
    capability('video-mp4', 'Vídeo', 'MP4', 'midia', ['ffmpeg', 'fluent-ffmpeg'], 'Media Engine', false, false, true),
    capability('video-gif', 'Vídeo', 'GIF', 'midia', ['ffmpeg'], 'Media Engine', false, false, true),
    capability('audio-texto', 'Áudio', 'Texto', 'midia', ['Whisper API', 'speech-to-text'], 'Media Engine', true, true),
    capability('wav-mp3', 'WAV', 'MP3', 'midia', ['ffmpeg', 'lame'], 'Media Engine', false, false, true)
];
export const conversionCapabilities = [
    ...documents,
    ...pdfAdvanced,
    ...spreadsheets,
    ...images,
    ...cad,
    ...electronics,
    ...media
];
export function findPluginByName(nome) {
    return conversionPlugins.find((plugin) => plugin.nome === nome);
}
export function buildConversionMatrix() {
    return conversionCapabilities.map((capability) => ({
        de: capability.origem,
        para: capability.destino,
        categoria: capability.categoria,
        status: capability.status,
        plugin: capability.plugin,
        engines: capability.engines
    }));
}
function capability(id, origem, destino, categoria, engines, plugin, premium = false, requerCredencial = false, requerBinarioLocal = false) {
    return {
        id,
        origem,
        destino,
        categoria,
        status: premium || requerBinarioLocal || requerCredencial ? 'preparado' : 'ativo',
        descricao: `${origem} para ${destino} via ${plugin}.`,
        engines,
        plugin,
        premium,
        requerCredencial,
        requerBinarioLocal
    };
}
