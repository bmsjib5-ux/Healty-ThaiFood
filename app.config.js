// Serve from a sub-path (e.g. GitHub Pages) when EXPO_BASE_URL is set; root otherwise (Render, local).
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
