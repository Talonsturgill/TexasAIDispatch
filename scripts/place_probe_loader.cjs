/** Diagnostic-only substitution; never write or change the production module. */
module.exports = function placeProbeLoader(source) {
  const {tone, stage} = this.getOptions();
  const needle = "const PROBE='#ff00ff';";
  if (this.resourcePath !== stage || !['black', 'white'].includes(tone)) {
    throw new Error('Place probe loader received an unexpected module or tone');
  }
  if (source.split(needle).length !== 2) {
    throw new Error('Place probe loader needs exactly one unchanged probe constant');
  }
  return source.replace(needle, `const PROBE='${tone === 'black' ? '#000000' : '#ffffff'}';`);
};
