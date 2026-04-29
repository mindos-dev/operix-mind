#!/usr/bin/env bash
set -euo pipefail

echo "Instalando dependências npm opcionais para conversões do Mind_IA..."

npm install -w @operix-mind/api \
  pdf-lib pdfjs-dist mammoth xlsx pptxgenjs \
  sharp jimp tesseract.js \
  marked \
  dxf-parser gerber-parser excellon-parser pcb-stackup \
  fluent-ffmpeg wavefile audio-decode \
  @google-cloud/vision @aws-sdk/client-textract \
  octokit nodemailer @slack/webhook

echo "Dependências npm opcionais instaladas. Binários de sistema devem ser provisionados por container ou agente local."
