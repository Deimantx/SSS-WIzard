export const escapeCell = (value: string) => value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

export const table = (headers: readonly string[], rows: readonly (readonly unknown[])[]) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => `| ${row.map((value) => escapeCell(String(value))).join(' | ')} |`),
].join('\n')

export const compactTable = (headers: readonly string[], rows: readonly (readonly unknown[])[]) => {
  if (headers.length > 10) throw new Error(`Balancing table has ${headers.length} columns; maximum is 10`)
  return table(headers, rows)
}

export const bullets = (items: readonly string[], empty = 'None') => items.length ? items.map((item) => `- ${item}`).join('\n') : `- ${empty}`

export const idLine = (id: string) => `**ID:** \`${id}\``

export const section = (title: string, body: string, level = 2) => `${'#'.repeat(level)} ${title}\n\n${body.trim()}`

export const cleanDocument = (contents: string) => `${contents.trim()}\n`
