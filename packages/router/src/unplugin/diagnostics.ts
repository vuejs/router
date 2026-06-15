import { createConsoleReporter, defineDiagnostics } from 'nostics'

/**
 * Build-time diagnostics catalog for the Vue Router unplugin (file-based
 * routing). These run in Node during the build, so they are not `__DEV__`
 * guarded and are reported on every build.
 *
 * `why` keeps the original warning text (so existing substring assertions keep
 * matching); the `VR_B####` code identifies the source, so messages do not
 * repeat a `[vue-router]` prefix. Codes are permanent: never rename or reuse.
 */
export const diagnostics = /*#__PURE__*/ defineDiagnostics({
  docsBase: code => `https://router.vuejs.org/errors/${code.toLowerCase()}`,
  // TODO: could use the ansi reporter probably
  reporters: [/*#__PURE__*/ createConsoleReporter()],
  codes: {
    // --- core/definePage.ts ---
    VR_B0001: {
      why: (p: { id: string; message: string }) =>
        `[${p.id}]: Failed to process definePage: ${p.message}`,
      fix: 'Fix the syntax error in the definePage() macro of this file.',
    },
    VR_B0002: {
      why: (p: { id: string; message: string }) => `[${p.id}]: ${p.message}`,
      fix: 'Avoid referencing <script setup> bindings inside definePage(); pass static values instead.',
    },
    VR_B0003: {
      why: (p: { id: string; message: string }) =>
        `[${p.id}]: Failed to extract definePage info: ${p.message}`,
      fix: 'Fix the syntax error in the definePage() macro of this file.',
    },
    VR_B0004: {
      why: (p: { id: string }) =>
        `route name must be a string literal or false. Found in "${p.id}".`,
      fix: 'Use a string literal or `false` for the route `name`.',
    },
    VR_B0005: {
      why: (p: { id: string }) =>
        `route path must be a string literal. Found in "${p.id}".`,
      fix: 'Use a string literal for the route `path`.',
    },
    VR_B0006: {
      why: (p: { paramName: string; type: string }) =>
        `Unrecognized default value in definePage() for query param "${p.paramName}". Typeof value: "${p.type}". This is a bug or a missing type of value, open an issue on https://github.com/vuejs/router and provide the definePage() code.`,
      fix: 'Report a reproduction at https://github.com/vuejs/router with the definePage() code.',
    },
    VR_B0007: {
      why: (p: { id: string }) =>
        `route alias must be a string literal or an array of string literals. Found in "${p.id}".`,
      fix: 'Use a string literal or an array of string literals for the route `alias`.',
    },
    VR_B0008: {
      why: (p: { found: string; id: string }) =>
        `route alias array must only contain string literals. Found ${p.found}in "${p.id}".`,
      fix: 'Only use string literals inside the route `alias` array.',
    },

    // --- options.ts ---
    VR_B0009: {
      why: (p: { ext: string }) =>
        `Invalid extension "${p.ext}". Extensions must start with a dot.`,
      fix: 'Prefix the extension with a dot, e.g. ".vue".',
    },

    // --- core/treeNodeValue.ts ---
    VR_B0010: {
      why: (p: { segment: string }) =>
        `Segment "${p.segment}" is missing the closing ")". It will be treated as a static segment.`,
      fix: 'Add the closing ")" to the dynamic segment.',
    },
    VR_B0011: {
      why: (p: { segment: string }) =>
        `Invalid parameter in path "${p.segment}": parameter name cannot be empty. Using default name "pathMatch" for ':()'.`,
      fix: 'Give the parameter a name, e.g. ":id".',
    },

    // --- core/customBlock.ts ---
    VR_B0012: {
      why: (p: { type: string; filePath: string; message: string }) =>
        `Invalid JSON5 format of <${p.type}> content in ${p.filePath}\n${p.message}`,
      fix: 'Fix the JSON5 syntax in the route custom block.',
    },
    VR_B0013: {
      why: (p: { type: string; filePath: string; message: string }) =>
        `Invalid JSON format of <${p.type}> content in ${p.filePath}\n${p.message}`,
      fix: 'Fix the JSON syntax in the route custom block.',
    },
    VR_B0014: {
      why: (p: { type: string; filePath: string; message: string }) =>
        `Invalid YAML format of <${p.type}> content in ${p.filePath}\n${p.message}`,
      fix: 'Fix the YAML syntax in the route custom block.',
    },
    VR_B0015: {
      why: (p: { lang: string; type: string; filePath: string }) =>
        `Language "${p.lang}" for <${p.type}> is not supported. Supported languages are: json5, json, yaml, yml. Found in in ${p.filePath}.`,
      fix: 'Use one of the supported languages: json5, json, yaml, yml.',
    },

    // --- utils/encoding.ts ---
    VR_B0016: {
      why: (p: { text: string }) =>
        `Error decoding "${p.text}". Using original value`,
      fix: 'Ensure the value is correctly percent-encoded.',
    },

    // --- codegen/generateRouteParams.ts ---
    VR_B0017: {
      why: (p: { fullPath: string; path: string }) =>
        `Warning: A parameter without a name was found in the route "${p.fullPath}" in segment "${p.path}".\n‼️ This is a bug, please report it at https://github.com/vuejs/router`,
      fix: 'Report a reproduction at https://github.com/vuejs/router.',
    },

    // --- codegen/generateParamParsers.ts ---
    VR_B0018: {
      why: (p: { filename: string; source: string }) =>
        `Cannot statically determine if "parser" is raw in "${p.filename}" because it is re-exported from "${p.source}". The generated route param types may be incorrect. Define the parser inline in this file with \`defineParamParser\`/\`defineParamParserRaw\` instead of re-exporting it.`,
      fix: 'Define the parser inline with `defineParamParser`/`defineParamParserRaw` instead of re-exporting it.',
    },
    VR_B0019: {
      why: (p: { parser: string; fullPath: string }) =>
        `Parameter parser "${p.parser}" not found for route "${p.fullPath}".`,
      fix: 'Define the param parser or use one of the native parsers.',
    },
  },
})
