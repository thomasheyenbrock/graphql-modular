export type Token = {
  type: typeof LEXICAL_TOKENS[number]["t"];
  value: string;
};

export function* tokenize(source: string): IterableIterator<Token> {
  let match: RegExpMatchArray | null = null;
  nextToken: while (source !== "") {
    for (const regex of IGNORED_TOKENS)
      if ((match = source.match(regex))) {
        source = source.substring(match[0].length);
        continue nextToken;
      }
    for (const { r, t, v } of LEXICAL_TOKENS)
      if ((match = source.match(r))) {
        source = source.substring(match[0].length);
        yield { type: t, value: v(match[0]) };
        continue nextToken;
      }
    throw new Error("Syntax error: " + displaySource(source));
  }
}

const IGNORED_TOKENS = [
  /** Unicode BOM */
  /^\ufeff/,
  /** White Space */
  /^[\t ]+/,
  /** Line Terminators */
  /^\n|\r(?!\n)|\r\n/,
  /** Comments */
  /^#.*/,
  /** Insignificant Commas */
  /^,+/,
] as const;

const v = (input: string) => input;

const LEXICAL_TOKENS = [
  /** Punctuators */
  { r: /^([!$&():=@\[\]{\|}]|\.\.\.)/, t: "PUNCTUATOR", v },
  /** Name */
  { r: /^[_a-zA-Z][_a-zA-Z0-9]*/, t: "NAME", v },
  /** IntValue */
  { r: /^-?(0|[1-9])[0-9]*(?![\._a-zA-Z0-9])/, t: "INT_VALUE", v },
  /** FloatValue */
  {
    r: /^-?(0|[1-9][0-9]*)(\.[0-9]+[eE][+-]?[0-9]+|\.[0-9]+|[eE][+-]?[0-9]+)(?![\._a-zA-Z0-9])/,
    t: "FLOAT_VALUE",
    v,
  },
  /**
   * StringValue (block string)
   *
   * IMPORTANT: check block strings before regular strings so that six quotes
   * are evaluated as empty block string and not three empty regular strings
   */
  {
    r: /^"""([^"\\]|"[^"]|""[^"]|\\[^"]|\\"[^"]|\\""[^"]|\\""")*"""/s,
    t: "BLOCK_STRING_VALUE",
    v: (input: string) =>
      blockStringValue(
        input.substring(3, input.length - 3).replace(/\\"""/g, '"""')
      ),
  },
  /** StringValue */
  {
    r: /^"([^"\\]|\\u{[0-9a-fA-F]+}|\\u[0-9a-fA-F]{4}|\\["\\\/bfnrt])*"/,
    t: "STRING_VALUE",
    v: (input: string) => {
      let output = input.substring(1, input.length - 1);
      for (const { r, f } of STRING_SEMANTICS) {
        output = output.replace(r, f);
      }
      return output;
    },
  },
] as const;

function displaySource(source: string) {
  const currentLine = source.split("\n")[0];
  return currentLine.length > 20
    ? currentLine.substring(0, 20) + "..."
    : currentLine;
}

const STRING_SEMANTICS = [
  /* variable width unicode characters */
  {
    r: /\\u{[0-9a-fA-F]+}/g,
    f: (match: string) => {
      const charCode = parseInt(match.substring(3, match.length - 1), 16);
      if (!isValidCharCode(charCode))
        throw new Error("Syntax error: Invalid char code " + match);
      return String.fromCharCode(charCode);
    },
  },
  /* supplementary characters */
  {
    r: /\\u[0-9a-fA-F]{4}\\u[0-9a-fA-F]{4}/g,
    f: (match: string) => {
      const leading = parseInt(match.substring(2, 6), 16);
      const trailing = parseInt(match.substring(8, 12), 16);
      if (leading >= 0xd800 && leading <= 0xdbff) {
        if (trailing < 0xdc00 || trailing > 0xdfff)
          throw new Error(
            "Syntax error: Invalid supplementary character " + match
          );
        return String.fromCharCode(
          (leading - 0xd800) * 0x400 + (trailing - 0xdc00) + 0x10000
        );
      }
      // Parse both character individually
      return match;
    },
  },
  /* fixed width unicode characters */
  {
    r: /\\u[0-9a-fA-F]{4}/g,
    f: (match: string) => {
      const charCode = parseInt(match.substring(2), 16);
      if (!isValidCharCode(charCode))
        throw new Error("Syntax error: Invalid char code " + match);
      return String.fromCharCode(charCode);
    },
  },
  /* escaped characters */
  {
    r: /\\["\\\/bfnrt]/g,
    f: (match: string) => {
      const escaped = match[1];
      return ESCAPED_CHARACTERS[escaped] || escaped;
    },
  },
] as const;

const ESCAPED_CHARACTERS: Record<string, string> = {
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

function isValidCharCode(charCode: number) {
  return (
    Number.isInteger(charCode) &&
    (isBetween(charCode, 0x0000, 0xd7ff) ||
      isBetween(charCode, 0xe000, 0x10ffff))
  );
}

function isBetween(n: number, lower: number, upper: number) {
  return n >= lower && n <= upper;
}

function blockStringValue(input: string) {
  let lines = input.split(/\n|\r(?!\n)|\r\n/g);
  let commonIndent: number | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    const leadingWhitespace = line.match(/^[\t ]*/);
    const indent = leadingWhitespace ? leadingWhitespace[0].length : 0;

    if (
      indent < line.length &&
      (commonIndent === null || indent < commonIndent)
    )
      commonIndent = indent;
  }

  if (commonIndent && commonIndent > 0)
    for (let i = 1; i < lines.length; i++)
      lines[i] = lines[i].slice(commonIndent);

  return lines
    .join("\n")
    .replace(/^[\t\n ]*/, "")
    .replace(/[\t\n ]*$/, "");
}
