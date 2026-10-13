/** Kerangka index.html standar Lab: memuat style.css dan script.js. */
export const page = (title: string, body: string) => `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${body}

  <script src="script.js"></script>
</body>
</html>
`

export const baseCss = `body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 24px;
  color: #1e293b;
}
`
