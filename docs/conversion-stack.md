# Mind_IA Conversion Stack

Este documento registra a arquitetura de conversão universal sem exigir instalação local pesada no build padrão.

## Camadas

- Documentos: `pdf-lib`, `pdf.js`, `mammoth`, `xlsx`, `pptxgenjs`, `LibreOffice headless`.
- OCR: `tesseract.js`, Google Cloud Vision, AWS Textract.
- Imagens: `sharp`, `jimp`, `resvg-js`, ImageMagick.
- CAD/3D: FreeCAD, Fusion 360, SolidWorks bridge, OpenSCAD, Blender, CuraEngine, PrusaSlicer.
- Eletrônica: `gerber-parser`, `excellon-parser`, KiCad `pcbnew`, `pcb-stackup`.
- Áudio/vídeo: `ffmpeg`, Whisper/Speech-to-text.

## Política

O backend expõe capacidades em `/api/conversions/options`, plugins em `/api/conversions/plugins` e matriz em `/api/conversions/matrix`.

As conversões marcadas como `ativo` podem ser tratadas por bibliotecas Node puras ou mocks locais. As marcadas como `preparado` dependem de credencial externa, binário CLI local ou bridge dedicada.

## Restrições

O projeto não instala binários de sistema automaticamente. Em produção, cada worker de conversão deve declarar suas ferramentas no container ou agente local responsável.
