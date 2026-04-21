// Firebase config has been replaced with MongoDB
// This stub ensures backward compatibility for existing imports

export const db = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false }),
      set: async () => {},
      update: async () => {},
      delete: async () => {},
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false }),
          set: async () => {},
          update: async () => {},
          delete: async () => {},
          collection: () => ({
            doc: () => ({
              get: async () => ({ exists: false }),
              set: async () => {},
              update: async () => {},
              delete: async () => {},
            }),
            get: async () => ({ docs: [] }),
          }),
        }),
        get: async () => ({ docs: [] }),
        where: () => ({
          get: async () => ({ empty: true, docs: [], forEach: () => {} }),
        }),
      }),
    }),
    where: () => ({
      get: async () => ({ empty: true, docs: [], forEach: () => {} }),
    }),
  }),
};

export default {};
 