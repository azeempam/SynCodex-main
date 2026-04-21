import axios from 'axios';

const EXEC_API = import.meta.env.VITE_CODE_EXEC_API;

export const runCode = async (language, code, stdin) => {
  const endpoint = `/run-${language.toLowerCase()}/`;

  try {
    const response = await axios.post(`${EXEC_API}${endpoint}`, { code, stdin, });
    return response.data;
  } catch (error) {
    console.error('Execution error:', error);
    throw error.response?.data || { error: 'Execution failed' };
  }
};
