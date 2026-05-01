export const integrations = [
    ['github', 'GitHub', 'Repositórios, branches, PRs e análise de código.', ['GITHUB_TOKEN']],
    ['autodesk', 'Autodesk', 'Base para integrações Autodesk Platform Services.', ['AUTODESK_CLIENT_ID', 'AUTODESK_CLIENT_SECRET'], true],
    ['autocad', 'AutoCAD', 'Integração futura para DWG e automações CAD.', ['AUTOCAD_TOKEN'], true],
    ['fusion360', 'Fusion 360', 'Integração futura para modelos e manufatura.', ['FUSION_TOKEN'], true],
    ['solidworks', 'SolidWorks', 'Bridge COM/.NET para conversões STEP, STL, DXF e desenhos técnicos.', ['SOLIDWORKS_BRIDGE_URL'], true],
    ['freecad', 'FreeCAD', 'Execução local futura via agente do cliente.', ['FREECAD_PATH'], true],
    ['cura', 'Cura 3D', 'Preparação para slicing e relatórios 3D.', ['CURA_PATH'], true],
    ['prusaslicer', 'PrusaSlicer', 'Slicing alternativo via CLI para geração de G-code.', ['PRUSASLICER_PATH'], true],
    ['openscad', 'OpenSCAD', 'Conversões paramétricas e exportação via CLI.', ['OPENSCAD_PATH'], true],
    ['blender', 'Blender', 'Processamento 3D headless, GLTF, OBJ, STL e previews.', ['BLENDER_PATH'], true],
    ['kicad', 'KiCad', 'PCB, Gerber, Excellon, BOM e relatórios eletrônicos.', ['KICAD_PATH'], true],
    ['libreoffice', 'LibreOffice', 'Conversões Office headless para DOCX, XLSX, PPTX e PDF.', ['LIBREOFFICE_PATH']],
    ['inkscape', 'Inkscape', 'Conversão vetorial SVG, PDF e PNG via CLI.', ['INKSCAPE_PATH']],
    ['imagemagick', 'ImageMagick', 'Conversões e otimizações de imagem via magick.', ['IMAGEMAGICK_PATH']],
    ['google-drive', 'Google Drive', 'Importar e exportar arquivos.', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']],
    ['dropbox', 'Dropbox', 'Sincronizar arquivos.', ['DROPBOX_TOKEN']],
    ['onedrive', 'OneDrive', 'Sincronizar arquivos Microsoft.', ['ONEDRIVE_CLIENT_ID']],
    ['box', 'Box', 'Armazenamento corporativo.', ['BOX_CLIENT_ID']],
    ['notion', 'Notion', 'Gerar documentos e bases.', ['NOTION_TOKEN']],
    ['slack', 'Slack', 'Enviar status e alertas.', ['SLACK_BOT_TOKEN']],
    ['telegram', 'Telegram', 'Conectar bot próprio, QR de pareamento e comandos DeepClaw.', ['TELEGRAM_BOT_TOKEN (usuário)']],
    ['whatsapp', 'WhatsApp', 'Atendimento futuro via canal oficial.', ['WHATSAPP_TOKEN'], true],
    ['aws', 'AWS', 'Base para S3, Bedrock, ECS, RDS e CloudWatch.', ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'], true],
    ['s3', 'S3', 'Uploads e arquivos gerados em produção.', ['AWS_S3_BUCKET'], true],
    ['bedrock', 'Bedrock', 'IA premium em nuvem com controle de custo.', ['AWS_BEDROCK_MODEL_ID'], true],
    ['textract', 'AWS Textract', 'OCR premium e extração de tabelas em documentos.', ['AWS_TEXTRACT_REGION'], true],
    ['google-vision', 'Google Cloud Vision', 'OCR e visão computacional para imagens e PDFs.', ['GOOGLE_APPLICATION_CREDENTIALS'], true]
].map(([id, nome, descricao, credenciais, premium]) => ({
    id: String(id),
    nome: String(nome),
    status: 'preparado',
    descricao: String(descricao),
    credenciais: credenciais,
    premium: Boolean(premium)
}));
export function listIntegrations() {
    return integrations;
}
