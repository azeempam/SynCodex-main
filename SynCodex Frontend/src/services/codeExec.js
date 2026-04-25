import axios from 'axios';

const DEFAULT_EXEC_API = 'http://localhost:6001';
const LOCAL_FALLBACK_EXEC_APIS = ['http://localhost:6001', 'http://localhost:6000'];

const normalizeExecApiBase = (rawBase) => {
  if (!rawBase || rawBase === 'undefined' || rawBase.includes('undefined')) {
    return DEFAULT_EXEC_API;
  }

  if (rawBase.startsWith('http://') || rawBase.startsWith('https://')) {
    return rawBase.replace(/\/$/, '');
  }

  if (rawBase.startsWith('/')) {
    return `${window.location.origin}${rawBase}`.replace(/\/$/, '');
  }

  return `${window.location.protocol}//${rawBase}`.replace(/\/$/, '');
};

const mapLanguage = (language) => {
  const normalized = (language || '').toLowerCase();
  const languageMap = {
    javascript: 'js',
    typescript: 'ts',
    cplusplus: 'cpp',
  };

  return languageMap[normalized] || normalized;
};

const EXEC_API = normalizeExecApiBase(import.meta.env.VITE_CODE_EXEC_API?.trim());

const buildCandidateBases = () => {
  const candidates = [EXEC_API, ...LOCAL_FALLBACK_EXEC_APIS];
  return [...new Set(candidates.filter(Boolean).map((base) => base.replace(/\/$/, '')))];
};

const isNetworkError = (error) => !error.response;

export const runCode = async (language, code, stdin) => {
  const resolvedLanguage = mapLanguage(language);
  const endpoint = `/run-${resolvedLanguage}/`;
  const payload = {
    code,
    input: stdin ?? '',
    stdin: stdin ?? '',
  };

  try {
    const candidates = buildCandidateBases();
    let lastError;

    for (const base of candidates) {
      try {
        const response = await axios.post(`${base}${endpoint}`, payload);
        return response.data;
      } catch (error) {
        lastError = error;
        if (!isNetworkError(error)) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Execution service unavailable');
  } catch (error) {
    console.error('Execution error:', error);
    throw error.response?.data || { error: 'Execution failed' };
  }
};
